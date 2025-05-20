import { useAction, useMutation, useQuery } from 'convex/react';
import { Audio } from 'expo-av';
import Constants from 'expo-constants'; // For accessing runtime config
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from 'expo-sharing';
import { OpenAI } from "openai"; // Import OpenAI
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    LogBox,
    Modal,
    Platform,
    SafeAreaView,
    SectionList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import {
    Camera,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronUp,
    Download,
    Edit,
    Mic,
    Settings,
    Share2,
    StopCircle,
    Trash2,
    UploadCloud,
    X,
} from "react-native-feather";
import { WebView } from 'react-native-webview';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

// --- OpenAI Whisper API Configuration ---
const WHISPER_API_KEY = Constants.expoConfig?.extra?.whisperApiKey;
// const TEST_VARIABLE = Constants.expoConfig?.extra?.testVariable; // Keep if used elsewhere, remove if not

console.log("[ProjectDetailScreen] Initial WHISPER_API_KEY from Constants.expoConfig.extra:", WHISPER_API_KEY);
// --- End OpenAI Whisper Config ---

// Define a type for the section keys to help TypeScript
type SectionName = 
  | "observations"
  | "coverPhoto"
  | "siteDescription"
  | "scopeOfEvaluation"
  | "recommendations"
  | "conclusions";

// Mock data for initial display - later this will come from Convex via props or route params
const initialProjectDetails = {
  projectType: "Safety Inspection Report",
  inspectionDate: "May 1, 2025",
  siteAddress: "123 Main St, Anytown, USA",
  siteName: "Downtown Building Renovation",
  clientName: "John Doe Developments",
  inspectorName: "Jane Smith (Inspector #123)",
};

// Define the type for project details data
type ProjectDetailsData = typeof initialProjectDetails;

// Add these lines after imports
LogBox.ignoreLogs([]); // clear custom ignores
LogBox.ignoreAllLogs(false); // show all warnings

// Define a type for observation items, useful for SectionList data
type Observation = {
  id: string;
  title: string;
  content: string;
  showNoteInput: boolean;
  noteText: string;
  imageUri?: string;
  imageFullUrl?: string;
  audioUri?: string;
};

// Define type for Recommendation items
type Recommendation = {
  id: string;
  text: string;
  // Add any UI-specific fields if needed, e.g., isEditing
};

// Define item types for SectionList data
type ObservationActionItem = { type: "observationActions"; id: "obs-actions" };
type StaticContentItem = { type: "staticContent"; id: string };
type SectionListItemType = Observation | ObservationActionItem | StaticContentItem;

interface Section {
  key: SectionName;
  title: string;
  data: ReadonlyArray<SectionListItemType>;
}

// Define the props for the ProjectDetailsSection component
interface ProjectDetailsSectionProps {
  projectId: string;
  initialData: ProjectDetailsData;
  onSave: (updatedData: ProjectDetailsData) => void;
}

// New Component: ProjectDetailsSection
const ProjectDetailsSection: React.FC<ProjectDetailsSectionProps> = ({ projectId, initialData, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProjectDetailsData>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const updateProjectMutation = useMutation(api.projects.updateProjectDetails);

  // Update formData if initialData changes (e.g., after a successful save from parent)
  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const handleInputChange = (field: keyof ProjectDetailsData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!projectId) {
      Alert.alert("Error", "Project ID is missing.");
      return;
    }
    setIsSaving(true);
    try {
      await updateProjectMutation({
        projectId: projectId as Id<"projects">,
        updates: formData,
      });
      onSave(formData);
      setIsEditing(false);
      Alert.alert("Success", "Project details saved!");
    } catch (error) {
      console.error("Failed to save project details:", error);
      Alert.alert("Error", "Failed to save project details. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(initialData);
    setIsEditing(false);
  };

  // Render a styled detail item
  const renderDetailItem = (label: string, value: string) => (
    <View style={styles.detailItem} key={label}>
      <Text style={styles.detailItemLabel}>{label}</Text>
      <Text style={styles.detailItemValue}>{value || "-"}</Text>
    </View>
  );

  return (
    <View style={styles.detailsContainer}> 
      {isEditing ? (
        <View style={styles.editDetailsForm}>
          <View style={styles.detailsActionsOnTopInEdit}>
            <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.actionIcon} disabled={isSaving}>
              <Text />
            </TouchableOpacity>
          </View>

          {(Object.keys(formData) as Array<keyof ProjectDetailsData>).map((key) => (
            <View style={styles.formGroup} key={key}>
              <Text style={styles.label}>{key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}:</Text>
              <TextInput
                style={styles.input}
                value={String(formData[key] ?? '')}
                onChangeText={(text) => handleInputChange(key, text)}
                editable={!isSaving}
              />
            </View>
          ))}
          <View style={styles.editActions}>
            <TouchableOpacity style={[styles.editButton, styles.cancelButton]} onPress={handleCancel} disabled={isSaving}>
              <X stroke="#fff" width={18} height={18} /><Text style={styles.editButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.editButton, styles.saveButton, isSaving && styles.disabledButton]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" style={{marginRight: 6}} />
              ) : (
                <Check stroke="#fff" width={18} height={18} />
              )}
              <Text style={styles.editButtonText}>{isSaving ? "Saving..." : "Save"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.detailsContent}>
          <View style={styles.detailsHeaderRowNonEditing}>
            <View style={styles.projectTypeBadge}>
              <Text style={styles.projectTypeBadgeText}>{formData.projectType || "Project"}</Text>
            </View>
            <View style={styles.detailsActions}>
              <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.actionIcon} disabled={isSaving}>
                <Edit stroke={"#1E6FFF"} width={22} height={22} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionIcon}><Share2 stroke="#1E6FFF" width={22} height={22} /></TouchableOpacity>
            </View>
          </View>

          <View style={styles.detailsListContainer}>
            {renderDetailItem("Project ID", String(Array.isArray(projectId) ? projectId.join(", ") : projectId ?? ''))}
            {(Object.keys(formData) as Array<keyof ProjectDetailsData>).map((key) => 
              renderDetailItem(
                key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase()),
                String(formData[key] ?? "")
              )
            )}
          </View>
        </View>
      )}
    </View>
  );
};

// NEW CONSTANTS FOR REPORT GENERATION
const REPORT_TEMPLATE_STORAGE_ID = "kg29xa03vdmcpbhveae7w97zms7g41nz" as Id<"_storage">;
const CONVEX_APP_URL = "https://outstanding-alligator-266.convex.cloud"; // Replace if your app URL is different

// Define a type for images in the report sections
interface ReportImage {
  url: string;
  caption?: string;
}

export default function ProjectDetailScreen() {
  const router = useRouter();
  const { id: rawProjectId } = useLocalSearchParams(); 
  const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;

  // NEW state for cover photo
  const [uploadingCoverPhoto, setUploadingCoverPhoto] = useState(false);

  // Audio Recording States
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioPermission, requestAudioPermission] = Audio.usePermissions();
  // State to track which observation is currently being recorded for
  const [recordingForObservationId, setRecordingForObservationId] = useState<string | null>(null);

  // NEW: State for generic text section recording
  const [isGenericRecording, setIsGenericRecording] = useState(false);
  const [genericRecordingSectionKey, setGenericRecordingSectionKey] = useState<SectionName | null>(null);

  // NEW: State for transcription loading
  const [isTranscribing, setIsTranscribing] = useState(false);

  // NEW: Report generation state and action
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const generateReportAction = useAction(api.reportTemplateUtils.generateAndStoreHtmlReport);

  // Fetch project data using useQuery
  const projectData = useQuery(
    api.projects.getProject,
    projectId ? { projectId: projectId as Id<"projects"> } : "skip"
  );

  // Initialize Mutations
  const generateUploadUrlMutation = useMutation(api.files.generateUploadUrl);
  const setCoverPhotoMutation = useMutation(api.projects.setCoverPhoto);
  const updateSiteDescriptionMutation = useMutation(api.projects.updateSiteDescriptionText);
  const updateScopeOfEvaluationMutation = useMutation(api.projects.updateScopeOfEvaluationText);
  const updateConclusionsMutation = useMutation(api.projects.updateConclusionsText);

  const [expandedSections, setExpandedSections] = useState<Record<SectionName, boolean>>({
    observations: true,
    coverPhoto: true,
    siteDescription: true,
    scopeOfEvaluation: false,
    recommendations: false,
    conclusions: false,
  });

  // Ensure initial observations include audioUri
  const [observations, setObservations] = useState<Observation[]>([
    { id: "obs-1", title: "Observation 1", content: "Please add observations here.", showNoteInput: false, noteText: "", audioUri: undefined },
    { id: "obs-2", title: "Observation 2", content: "Please add observations here.", showNoteInput: false, noteText: "", audioUri: undefined },
  ]);

  const [showAreaModal, setShowAreaModal] = useState(false);
  const [areaName, setAreaName] = useState("");

  // This state will now be the single source of truth for project details display
  const [projectDetails, setProjectDetails] = useState<ProjectDetailsData>(initialProjectDetails);
  const [coverPhotoUri, setCoverPhotoUri] = useState<string | null>(null); // State for cover photo
  const [siteDescriptionText, setSiteDescriptionText] = useState<string>("");
  const [scopeOfEvaluationText, setScopeOfEvaluationText] = useState<string>("");
  const [conclusionsText, setConclusionsText] = useState<string>("");
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  // Editing state for text sections
  const [isEditingSiteDescription, setIsEditingSiteDescription] = useState(false);
  const [currentSiteDescriptionInput, setCurrentSiteDescriptionInput] = useState("");

  const [isEditingScopeOfEvaluation, setIsEditingScopeOfEvaluation] = useState(false);
  const [currentScopeOfEvaluationInput, setCurrentScopeOfEvaluationInput] = useState("");

  const [isEditingConclusions, setIsEditingConclusions] = useState(false);
  const [currentConclusionsInput, setCurrentConclusionsInput] = useState("");

  console.log('VirtualizedList error check for ProjectDetailScreen'); 
  console.log('Mounting ProjectDetailScreen');

  // Request Audio Permission
  useEffect(() => {
    if (!audioPermission || audioPermission.status !== 'granted') {
      requestAudioPermission();
    }
  }, [audioPermission, requestAudioPermission]);

  // Effect to update local state when projectData is fetched or changes
  useEffect(() => {
    if (projectData) {
      setProjectDetails({
        projectType: projectData.projectType || "",
        inspectionDate: projectData.inspectionDate || "",
        siteAddress: projectData.siteAddress || "",
        siteName: projectData.siteName || "",
        clientName: projectData.clientName || "",
        inspectorName: projectData.inspectorName || "",
      });
      setCoverPhotoUri(projectData.coverPhotoUri || null);
      setSiteDescriptionText(projectData.siteDescriptionText || "");
      setCurrentSiteDescriptionInput(projectData.siteDescriptionText || "");
      setScopeOfEvaluationText(projectData.scopeOfEvaluationText || "");
      setCurrentScopeOfEvaluationInput(projectData.scopeOfEvaluationText || "");
      setConclusionsText(projectData.conclusionsText || "");
      setCurrentConclusionsInput(projectData.conclusionsText || "");
      
      if (projectData.observations) {
        setObservations(projectData.observations.map(obs => ({
          ...obs,
          id: obs.id, // Ensure ID is a string
          showNoteInput: false, // Initialize UI-specific state
          noteText: obs.content, // Initialize noteText with content or make it empty
          audioUri: obs.audioUri || undefined, // Initialize audioUri, ensure it's part of obs type from Convex or default to undefined
        })));
      } else {
        setObservations([]); // Initialize with empty array if no observations
      }

      if (projectData.recommendations) {
        setRecommendations(projectData.recommendations.map(rec => ({
          ...rec,
          id: rec.id, // Ensure ID is a string
        })));
      } else {
        setRecommendations([]); // Initialize with empty array if no recommendations
      }
    }
  }, [projectData]);

  // MODIFIED: pickImageAsync to return asset or null
  const pickImageAsync = async (): Promise<ImagePicker.ImagePickerAsset | null> => {
    await requestMediaLibraryPermissions();
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, 
      allowsEditing: true,
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0];
    }
    return null;
  };

  // MODIFIED: takePhotoAsync to return asset or null
  const takePhotoAsync = async (): Promise<ImagePicker.ImagePickerAsset | null> => {
    await requestCameraPermissions();
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0];
    }
    return null;
  };
  
  // NEW function to handle upload and mutation call for Cover Photo
  const uploadAndSetCoverPhoto = async (asset: ImagePicker.ImagePickerAsset) => {
    if (!projectId) {
      Alert.alert("Error", "Project ID is missing.");
      return;
    }
    setUploadingCoverPhoto(true);
    try {
      // 1. Get a presigned URL for uploading
      const postUrl = await generateUploadUrlMutation();

      // 2. Fetch the image data as a blob (React Native specific)
      const response = await fetch(asset.uri);
      const blob = await response.blob();

      // 3. POST the blob to the presigned URL
      const uploadResult = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": asset.mimeType || "image/jpeg" }, // Use mimeType from asset or default
        body: blob,
      });

      if (!uploadResult.ok) {
        const errorText = await uploadResult.text();
        console.error("Upload failed response:", errorText);
        throw new Error(`Upload failed: ${uploadResult.status}`);
      }

      const { storageId } = await uploadResult.json();
      if (!storageId) {
        throw new Error("storageId not found in upload response.");
      }

      // 4. Save the storage ID to the project's coverPhotoUri field
      await setCoverPhotoMutation({
        projectId: projectId as Id<"projects">,
        coverPhotoStorageId: storageId,
      });
      
      // Update local state - projectData refetch by useQuery will also update this
      setCoverPhotoUri(storageId); 

      Alert.alert("Success", "Cover photo updated!");

    } catch (error) {
      console.error("Error uploading cover photo:", error);
      Alert.alert("Error", `Failed to upload cover photo: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setUploadingCoverPhoto(false);
    }
  };

  const setObservationImageUri = (id: string, uri: string) => {
    setObservations(prevObs => 
      prevObs.map(obs => (obs.id === id ? { ...obs, imageUri: uri } : obs))
    );
  };

  const setObservationAudioUri = (id: string, uri: string | undefined) => {
    setObservations(prevObs =>
      prevObs.map(obs => (obs.id === id ? { ...obs, audioUri: uri } : obs))
    );
    console.log(`Audio URI for observation ${id}: ${uri}`);
  };

  const toggleSection = (sectionKey: SectionName) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const addNewObservation = () => {
    const newId = `obs-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setObservations((prev) => [
      ...prev,
      {
        id: newId,
        title: `Observation ${prev.length + 1}`,
        content: "Please add observations here.",
        showNoteInput: false,
        noteText: "",
        audioUri: undefined,
      },
    ]);
  };

  const toggleNoteInput = (id: string) => {
    setObservations(observations.map((obs) => (obs.id === id ? { ...obs, showNoteInput: !obs.showNoteInput } : obs)));
  };

  const updateNoteText = (id: string, text: string) => {
    setObservations(observations.map((obs) => (obs.id === id ? { ...obs, noteText: text } : obs)));
  };

  const saveNote = (id: string) => {
    setObservations(
      observations.map((obs) => (obs.id === id ? { ...obs, content: obs.noteText, showNoteInput: false } : obs)),
    );
  };

  const removeObservation = (id: string) => {
    setObservations(prev => prev.filter(o => o.id !== id));
    if (recordingForObservationId === id) {
      // If currently recording for this observation, stop recording
      stopRecording(id);
    }
  };

  // --- Audio Recording Functions ---
  async function startRecordingForObservation(observationId: string) {
    if (!audioPermission?.granted) {
      Alert.alert("Permission Required", "Microphone permission is needed to record audio.");
      const permissionResponse = await requestAudioPermission();
      if (!permissionResponse.granted) {
          return;
      }
    }

    if (isRecording) { // If already recording, stop the current one first
        await stopRecording(recordingForObservationId); // Pass the ID of the observation being recorded
    }

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      console.log('Starting recording..');
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      setIsRecording(true);
      setRecordingForObservationId(observationId); // Track which observation this recording is for
      console.log('Recording started for observation:', observationId);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert("Recording Error", "Failed to start audio recording.");
    }
  }

  async function stopRecording(observationId: string | null) {
    if (!recording || !observationId) {
      console.log("No active recording or observationId to stop.");
      return;
    }
    console.log('Stopping recording for observation:', observationId);
    setIsRecording(false);
    setRecordingForObservationId(null); // Clear the tracking ID
    // Capture the recording object before setting it to null in a finally block
    const currentRecording = recording;
    setRecording(null); // Clear the recording object early to prevent reuse issues

    try {
        await currentRecording.stopAndUnloadAsync();
        const uri = currentRecording.getURI();
        console.log('Observation recording stopped and stored at', uri);
        if (uri) {
            setObservationAudioUri(observationId, uri); // Save URI to the specific observation
            
            // Start transcription
            const transcribedText = await transcribeAudio(uri);
            if (transcribedText) {
                setObservations(prevObs => 
                    prevObs.map(obs => 
                        obs.id === observationId 
                        ? { ...obs, noteText: transcribedText, content: transcribedText, showNoteInput: false } // Update noteText, content, and hide input
                        : obs
                    )
                );
                Alert.alert("Transcription Complete", "The note has been updated with the transcribed text.");
            } else {
                Alert.alert("Transcription Failed", "Could not transcribe the audio. Please try typing the note or check logs.");
            }
        }
    } catch (error) {
        console.error("Error stopping, unloading, or transcribing observation recording", error);
        Alert.alert("Error", "An error occurred during recording or transcription.");
    } finally {
        // Recording object is already cleared
    }
  }

  // NEW: Generic Start Recording Function (for Site Description, Scope, Conclusions)
  async function startGenericRecording(sectionKey: SectionName) {
    if (!audioPermission?.granted) {
      Alert.alert("Permission Required", "Microphone permission is needed to record audio.");
      const permissionResponse = await requestAudioPermission();
      if (!permissionResponse.granted) {
          return;
      }
    }

    // If already recording for an observation, stop it first
    if (isRecording && recordingForObservationId) {
        await stopRecording(recordingForObservationId);
    }
    // If already recording for another generic section, stop it
    if (isGenericRecording && genericRecordingSectionKey && genericRecordingSectionKey !== sectionKey) {
      await stopGenericRecording(); // stop previous generic recording
    }


    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      console.log('Starting generic recording for section:', sectionKey);
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      setIsGenericRecording(true);
      setGenericRecordingSectionKey(sectionKey);
      console.log('Generic recording started for section:', sectionKey);
    } catch (err) {
      console.error('Failed to start generic recording', err);
      Alert.alert("Recording Error", "Failed to start audio recording for this section.");
    }
  }

  // NEW: Generic Stop Recording Function
  async function stopGenericRecording() {
    if (!recording || !isGenericRecording || !genericRecordingSectionKey) {
      console.log("No active generic recording to stop.");
      return;
    }
    const currentSectionKey = genericRecordingSectionKey; // Capture before clearing
    console.log('Stopping generic recording for section:', currentSectionKey);
    setIsGenericRecording(false);
    setGenericRecordingSectionKey(null);
    const currentRecording = recording;
    setRecording(null); // Clear the recording object early

    try {
        await currentRecording.stopAndUnloadAsync();
        const uri = currentRecording.getURI();
        console.log(`Generic recording for section ${currentSectionKey} stopped and stored at`, uri);
        if (uri) {
            const transcribedText = await transcribeAudio(uri);
            if (transcribedText) {
                switch (currentSectionKey) {
                    case "siteDescription":
                        setCurrentSiteDescriptionInput(transcribedText);
                        setIsEditingSiteDescription(true);
                        break;
                    case "scopeOfEvaluation":
                        setCurrentScopeOfEvaluationInput(transcribedText);
                        setIsEditingScopeOfEvaluation(true);
                        break;
                    case "conclusions":
                        setCurrentConclusionsInput(transcribedText);
                        setIsEditingConclusions(true);
                        break;
                }
                Alert.alert("Transcription Complete", `The ${currentSectionKey.replace(/([A-Z])/g, " $1").toLowerCase()} has been updated. Please review and save.`);
            } else {
                 Alert.alert("Transcription Failed", `Could not transcribe audio for ${currentSectionKey}.`);
            }
        }
    } catch (error) {
        console.error("Error stopping, unloading or transcribing generic recording", error);
        Alert.alert("Error", "An error occurred during recording or transcription.");
    } finally {
        // Recording object is already cleared
    }
  }

  // NEW: Function to transcribe audio using OpenAI Whisper API
  async function transcribeAudio(audioUri: string): Promise<string | null> {
    if (!WHISPER_API_KEY) {
        console.error("OpenAI Whisper API key is not set. Please set EXPO_PUBLIC_WHISPER_API_KEY in your .env file.");
        Alert.alert("API Key Missing", "OpenAI Whisper API key is not configured.");
        return null;
    }
    if (!audioUri) {
        console.error("Audio URI is missing.");
        Alert.alert("Audio Error", "No audio file URI to transcribe.");
        return null;
    }

    setIsTranscribing(true);
    console.log("Starting OpenAI Whisper transcription for URI:", audioUri);

    try {
        const client = new OpenAI({ apiKey: WHISPER_API_KEY });

        // For the OpenAI Node SDK, we need to provide a File-like object.
        // Expo's FileSystem can provide a URI. We need to make this URI accessible
        // as a file stream or read its content appropriately.
        // The `file` parameter in `client.audio.transcriptions.create` expects a `File` object or a `fs.ReadStream` in Node.js.
        // In React Native, we don't have direct `fs.ReadStream`.
        // We can fetch the audio URI as a blob and then create a File-like object.

        const audioBlob = await fetch(audioUri).then(r => r.blob());
        
        // Create a File-like object. The name is important.
        // Ensure the filename has a valid extension for OpenAI (e.g., .m4a, .mp3)
        // Expo AV on iOS often records as .m4a
        const audioFile = new File([audioBlob], audioUri.split('/').pop() || "audio.m4a", { type: audioBlob.type });


        console.log("Transcribing with model: gpt-4o-transcribe");
        const transcription = await client.audio.transcriptions.create({
            model: "gpt-4o-transcribe", // Or "whisper-1" if preferred, or "gpt-4o-mini-transcribe"
            file: audioFile,
            // response_format: "text", // Optional: defaults to json, text is also an option for gpt-4o models
        });

        console.log("OpenAI Whisper API Response:", transcription);

        if (transcription && typeof transcription.text === 'string') {
            console.log("OpenAI Whisper Transcription successful:", transcription.text);
            return transcription.text;
        } else {
            // Handle cases where transcription might be structured differently or text is missing
            // For gpt-4o models with default json response, transcription is the object itself, and .text holds the string.
            // If response_format was 'text', transcription would be a simple string.
            // The default response (json) for gpt-4o models should have a 'text' property.
            // If using 'whisper-1' and 'verbose_json', the structure is much richer.
             if (transcription && (transcription as any).text) { // Check if text property exists even if type is not perfectly matched
                console.log("OpenAI Whisper Transcription successful (fallback check):", (transcription as any).text);
                return (transcription as any).text;
            }
            console.warn("Transcription successful but no text returned or unexpected format. Full response:", transcription);
            Alert.alert("Transcription Note", "Audio processed, but no speech was detected or text returned.");
            return ""; // Return empty string if no speech detected vs. null for error
        }
    } catch (error: any) {
        console.error("Error during OpenAI Whisper transcription:", error);
        let errorMessage = "Unknown error during transcription.";
        if (error.response) { // Axios-like error structure from OpenAI SDK
            console.error("Error response data:", error.response.data);
            errorMessage = error.response.data?.error?.message || JSON.stringify(error.response.data);
        } else if (error.message) {
            errorMessage = error.message;
        }
        Alert.alert("Transcription Error", `An error occurred: ${errorMessage}`);
        return null;
    } finally {
        setIsTranscribing(false); // Ensure this is always reset
    }
  }

  // NEW Cover Photo Handlers
  const handlePickCoverPhoto = async () => {
    const asset = await pickImageAsync();
    if (asset) {
      await uploadAndSetCoverPhoto(asset);
    }
  };

  const handleTakeCoverPhoto = async () => {
    const asset = await takePhotoAsync();
    if (asset) {
      await uploadAndSetCoverPhoto(asset);
    }
  };

  const handleRemoveCoverPhoto = async () => {
    if (!projectId) {
      Alert.alert("Error", "Project ID is missing.");
      return;
    }
    Alert.alert(
      "Remove Cover Photo",
      "Are you sure you want to remove the cover photo?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setUploadingCoverPhoto(true); 
            try {
              await setCoverPhotoMutation({
                projectId: projectId as Id<"projects">,
                coverPhotoStorageId: undefined, 
              });
              setCoverPhotoUri(null); 
              Alert.alert("Success", "Cover photo removed.");
            } catch (error) {
              console.error("Error removing cover photo:", error);
              Alert.alert("Error", "Could not remove cover photo.");
            } finally {
              setUploadingCoverPhoto(false);
            }
          },
        },
      ]
    );
  };

  // Permission requesting functions
  const requestCameraPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is needed to take photos.');
      return false;
    }
    return true;
  };

  const requestMediaLibraryPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Media library permission is needed to choose photos.');
      return false;
    }
    return true;
  };

  // NEW: Handler for generating and sharing the report
  const handleGenerateReport = async () => {
    if (!projectId || !projectData) {
      Alert.alert("Error", "Project ID or project data is missing.");
      return;
    }
    setIsGeneratingReport(true);
    setReportUrl(null); // Reset previous URL

    try {
      // --- Construct the new reportData structure ---
      // projectData is typed based on the query. It should now include coverPhotoFullUrl from the backend.
      const typedProjectData = projectData as (typeof projectData & { coverPhotoFullUrl?: string });
      const coverImageUrl = typedProjectData.coverPhotoFullUrl || "https://via.placeholder.com/800x400.png?text=Cover+Image+Not+Available";

      const reportFields = [
        { label: "Property Name", value: projectData.name || "N/A" },
        { label: "Property Address", value: projectData.siteAddress || "N/A" },
        { label: "Client Name", value: projectData.clientName || "N/A" },
        { label: "Inspection Date", value: projectData.inspectionDate || "N/A" },
        { label: "Inspector Name", value: projectData.inspectorName || "N/A" },
        // Add more fields from projectData as needed for the cover
      ];

      // Build tocEntries and sections from projectData.observations and other text fields
      // This is a conceptual mapping. You'll need to adjust based on your actual data.
      const tocEntries = [];
      const sections = [];

      // Example: Cover Photo section (if you want it in TOC and as a section)
      // tocEntries.push({ id: "cover_photo_section", title: "Cover Photo" });
      // sections.push({
      //   id: "cover_photo_section",
      //   title: "1. Cover Photo",
      //   content: `<p>See cover page.</p>`, // Or embed the image again if desired
      //   images: projectData.coverPhotoUri ? [{ url: coverImageUrl, caption: "Cover Photo" }] : []
      // });

      if (typedProjectData.siteDescriptionText) {
        tocEntries.push({ id: "site_description", title: "Site Description" });
        sections.push({
          id: "site_description",
          title: `${sections.length + 1}. Site Description`,
          content: `<p>${typedProjectData.siteDescriptionText.replace(/\n/g, "<br>")}</p>`
        });
      }

      if (typedProjectData.scopeOfEvaluationText) {
        tocEntries.push({ id: "scope_of_evaluation", title: "Scope of Evaluation" });
        sections.push({
          id: "scope_of_evaluation",
          title: `${sections.length + 1}. Scope of Evaluation`,
          content: `<p>${typedProjectData.scopeOfEvaluationText.replace(/\n/g, "<br>")}</p>`
        });
      }

      if (typedProjectData.observations && typedProjectData.observations.length > 0) {
        tocEntries.push({ id: "observations_section", title: "Observations" });
        let observationsContent = "";
        const observationImages: ReportImage[] = []; 
        // obs here is from projectData.observations, which backend now populates with imageFullUrl
        typedProjectData.observations.forEach(obs => { 
          observationsContent += `<h3>${obs.title || 'Observation'}</h3><p>${obs.content ? obs.content.replace(/\n/g, "<br>") : 'No content.'}</p>`;
          // Use the new pre-fetched full URL for observation images
          if ((obs as any).imageFullUrl) { // Access dynamically added imageFullUrl
            observationImages.push({ url: (obs as any).imageFullUrl, caption: obs.title || 'Observation Image' });
          }
        });
        sections.push({
          id: "observations_section",
          title: `${sections.length + 1}. Observations`,
          content: observationsContent,
          images: observationImages // This now has a type
        });
      }
      
      if (typedProjectData.recommendations && typedProjectData.recommendations.length > 0) {
          tocEntries.push({ id: "recommendations_section", title: "Recommendations" });
          let recommendationsContent = "<ul>";
          typedProjectData.recommendations.forEach(rec => {
              recommendationsContent += `<li>${rec.text ? rec.text.replace(/\n/g, "<br>") : 'No content.'}</li>`;
          });
          recommendationsContent += "</ul>";
          sections.push({
              id: "recommendations_section",
              title: `${sections.length + 1}. Recommendations`,
              content: recommendationsContent
          });
      }


      if (typedProjectData.conclusionsText) {
        tocEntries.push({ id: "conclusions_section", title: "Conclusions" });
        sections.push({
          id: "conclusions_section",
          title: `${sections.length + 1}. Conclusions`,
          content: `<p>${typedProjectData.conclusionsText.replace(/\n/g, "<br>")}</p>`
        });
      }

      const finalReportData = {
        reportTitle: projectData.originalTemplateTitle || projectData.name || "Field Report",
        coverImageUrl: coverImageUrl,
        reportFields: reportFields,
        tocEntries: tocEntries,
        sections: sections,
        footerText: `Report for ${typedProjectData.name} - Generated by ConstructOS`
      };
      // --- End of reportData construction ---

      // Call the action with projectId
      const result = await generateReportAction({
        projectId: projectId as Id<"projects">, // <-- PASS projectId HERE
        templateStorageId: REPORT_TEMPLATE_STORAGE_ID,
        reportData: finalReportData, 
        outputFileName: `report_${projectId}_${new Date().toISOString()}.html`,
      });

      // Use the direct reportUrl from the action's response
      if (result && result.reportUrl) {
        const directReportUrl = result.reportUrl;
        setReportUrl(directReportUrl); // Set state for displaying the link and potentially for WebView

        // Attempt to automatically open the direct URL in external browser
        try {
          await Linking.openURL(directReportUrl);
        } catch (err) {
          console.error("Failed to open direct report URL:", err);
          Alert.alert("Error", "Could not automatically open the report. You can use the link provided or try sharing.");
        }
        // setShowReportModal(true); // Keep this if you still want the WebView modal as an option/fallback
      } else {
        Alert.alert("Error", "Failed to generate report or report URL not found in response.");
      }
    } catch (error: any) {
      console.error("Failed to generate report:", error);
      Alert.alert("Error Generating Report", error.message || "An unknown error occurred.");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Component for a single observation item
  const ObservationItem = ({ item }: { item: Observation }) => (
    <View style={styles.observationItem}>
      <View style={styles.observationHeader}>
        <Text style={styles.observationTitle}>{item.title}</Text>
        <TouchableOpacity onPress={() => removeObservation(item.id)} style={styles.removeButton}>
          <Trash2 stroke="#FF3B30" width={20} height={20} />
        </TouchableOpacity>
      </View>
      <Text style={styles.observationContent}>{item.content}</Text>
      
      {item.imageUri && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.imageUri }} style={styles.observationImage} />
          <View style={styles.captionContainer}>
            <Text style={styles.captionText}>+ Caption (optional)</Text>
          </View>
        </View>
      )}
      
      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={styles.actionButtonFullWidth} 
          onPress={() => pickImageAsync().then(asset => setObservationImageUri(item.id, asset?.uri || ""))}
        >
          <UploadCloud stroke="#fff" width={18} height={18} style={{marginRight: 5}} />
          <Text style={styles.actionButtonText}>Upload Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButtonFullWidth} 
          onPress={() => takePhotoAsync().then(asset => setObservationImageUri(item.id, asset?.uri || ""))}
        >
          <Camera stroke="#fff" width={18} height={18} style={{marginRight: 5}} />
          <Text style={styles.actionButtonText}>Take Photo</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.actionButtonFullWidth} onPress={() => toggleNoteInput(item.id)}>
          <Text style={styles.actionButtonText}>Type Note</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.actionButtonOutline, 
            isRecording && recordingForObservationId === item.id && styles.recordingActiveButton
          ]} 
          onPress={() => {
            if (isRecording && recordingForObservationId === item.id) {
              stopRecording(item.id);
            } else {
              startRecordingForObservation(item.id);
            }
          }}
        >
          {isRecording && recordingForObservationId === item.id ? (
            <StopCircle stroke="#1E6FFF" width={18} height={18} style={{marginRight: 5}} />
          ) : (
            <Mic stroke="#1E6FFF" width={18} height={18} style={{marginRight: 5}} />
          )}
          <Text style={styles.actionButtonOutlineText}>
            {isRecording && recordingForObservationId === item.id ? "Stop Recording" : "Speak Note"}
          </Text>
        </TouchableOpacity>
      </View>
      
      {item.audioUri && (
        <View style={styles.audioPlayerContainer}>
          <Text style={styles.audioPlayerText}>Recorded Note:</Text>
          <Text numberOfLines={1} ellipsizeMode="middle" style={styles.audioUriText}>{item.audioUri.split('/').pop()}</Text>
          <TouchableOpacity onPress={() => setObservationAudioUri(item.id, undefined)} style={styles.removeAudioButton}>
            <Trash2 stroke="#FF3B30" width={16} height={16} />
          </TouchableOpacity>
        </View>
      )}
      
      {item.showNoteInput && (
        <View style={styles.noteInputContainer}>
          <TextInput
            style={styles.noteInput}
            multiline
            placeholder="Type your note here..."
            value={item.noteText}
            onChangeText={(text) => updateNoteText(item.id, text)}
          />
          <TouchableOpacity style={styles.saveNoteButton} onPress={() => saveNote(item.id)}>
            <Text style={styles.saveNoteText}>Save Note</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {isTranscribing && recordingForObservationId === item.id && (
        <Text style={styles.transcribingText}>Transcribing note...</Text>
      )}
    </View>
  );
    
  // Add these updated styles
  const styles = StyleSheet.create({
    // ... existing styles ...
    
    observationItem: {
      marginBottom: 24,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
      paddingBottom: 16,
      backgroundColor: '#FFFDF5', // Light amber background for observations
      borderRadius: 8,
      padding: 12,
    },
    removeButton: {
      padding: 5,
    },
    imageContainer: {
      position: 'relative',
      marginBottom: 12, 
      borderRadius: 8,
      overflow: 'hidden',
    },
    captionContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      padding: 5,
    },
    captionText: {
      color: 'white',
      fontSize: 12,
      textAlign: 'center',
    },
    actionButtonOutline: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#1E6FFF',
      backgroundColor: "transparent",
      paddingVertical: 12,
      borderRadius: 20,
    },
    actionButtonOutlineText: {
      color: "#1E6FFF",
      fontWeight: "600",
      fontSize: 15,
    },
    transcribingText: {
      color: '#6B7280',
      fontSize: 14,
      fontStyle: 'italic',
      marginTop: 8,
    },
    // ... rest of styles ...
  });

  // Callback for ProjectDetailsSection to update parent state
  const handleProjectDetailsSave = (updatedData: ProjectDetailsData) => {
    setProjectDetails(updatedData);
  };

  // List Header Component: Project Details
  const ListHeader = () => {
    if (!projectId || projectData === undefined) {
      return <View style={styles.detailsContainer}><ActivityIndicator size="large" color="#2D74FF" /><Text style={{textAlign: 'center', marginTop: 10}}>Loading project details...</Text></View>;
    }
    if (projectData === null) {
       return <View style={styles.detailsContainer}><Text style={{textAlign: 'center', color: 'red'}}>Failed to load project details. Project not found or error occurred.</Text></View>;
    }
    return (
      <ProjectDetailsSection
        projectId={projectId}
        initialData={projectDetails}
        onSave={handleProjectDetailsSave}
      />
    );
  };

  // List Footer Component: Report Actions - UPDATE THIS
  const ListFooter = () => (
    <View style={styles.listFooter}>
      {isTranscribing && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <ActivityIndicator size="small" color="#007AFF" style={{ marginRight: 8 }} />
          <Text>Transcribing audio...</Text>
        </View>
      )}
      <TouchableOpacity
        style={[styles.actionButton, styles.generateReportButton]}
        onPress={handleGenerateReport}
        disabled={isGeneratingReport || projectData === undefined || projectData === null}
      >
        {isGeneratingReport ? (
          <ActivityIndicator color="#fff" size="small" style={{ marginRight: 10 }}/>
        ) : (
          <Download stroke="#fff" width={20} height={20} style={{ marginRight: 10 }} />
        )}
        <Text style={styles.actionButtonText}>
          {isGeneratingReport ? "Generating Report..." : "Generate Report"}
        </Text>
      </TouchableOpacity>

      {/* Conditionally display the link to the report */}
      {reportUrl && !isGeneratingReport && (
        <TouchableOpacity 
          style={styles.reportLinkContainer} 
          onPress={async () => {
            try {
              await Linking.openURL(reportUrl);
            } catch (err) {
              console.error("Failed to open URL from link:", err);
              Alert.alert("Error", "Could not open the report link.");
            }
          }}
        >
          <Text style={styles.reportLinkText}>View Report in Browser</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Prepare sections data for SectionList
  const sectionsData: Section[] = [
    {
      key: "observations",
      title: "Observations (Required)",
      data: expandedSections.observations 
            ? [...observations, { type: "observationActions", id: "obs-actions" }] 
            : [],
    },
    {
      key: "coverPhoto",
      title: "Cover Photo",
      data: expandedSections.coverPhoto ? [{ type: "staticContent", id: "coverPhotoContent" }] : [],
    },
    {
      key: "siteDescription",
      title: "Site Description",
      data: expandedSections.siteDescription ? [{ type: "staticContent", id: "siteDescriptionContent" }] : [],
    },
    {
      key: "scopeOfEvaluation",
      title: "Scope of Evaluation",
      data: expandedSections.scopeOfEvaluation ? [{ type: "staticContent", id: "scopeOfEvaluationContent" }] : [],
    },
    {
      key: "recommendations",
      title: "Recommendations",
      data: expandedSections.recommendations ? [{ type: "staticContent", id: "recommendationsContent" }] : [],
    },
    {
      key: "conclusions",
      title: "Conclusions",
      data: expandedSections.conclusions ? [{ type: "staticContent", id: "conclusionsContent" }] : [],
    },
  ];

  // Render item for SectionList
  const renderSectionListItem = ({ item, section }: { item: SectionListItemType; section: Section }) => {
    if (!expandedSections[section.key]) {
      return null; // Section is collapsed
    }

    // Handle Observation items
    if (section.key === "observations") {
      if ('type' in item && item.type === "observationActions") {
        return (
          <View style={styles.sectionContent}>
            <TouchableOpacity style={styles.addButton} onPress={addNewObservation}>
              <ChevronUp stroke="#2D74FF" width={20} height={20} style={{ transform: [{ rotate: "45deg" }] }} />
              <Text style={styles.addButtonText}>Add new observation</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton} onPress={() => setShowAreaModal(true)}>
              <ChevronUp stroke="#2D74FF" width={20} height={20} style={{ transform: [{ rotate: "45deg" }] }} />
              <Text style={styles.addButtonText}>Add new area</Text>
            </TouchableOpacity>
            {/* The collapse button is part of the header, no need to render here */}
          </View>
        );
      }
      // It's an Observation object
      return <ObservationItem item={item as Observation} />;
    }
    
    // Handle Static Content for other sections
    if ('type' in item && item.type === "staticContent") {
      switch (section.key) {
        case "coverPhoto": {
          const actualImageUrl = useQuery(
            api.files.getStoredFileUrl, 
            coverPhotoUri ? { storageId: coverPhotoUri } : ("skip" as const) // Use "skip" literal
          );
          // isLoadingUrl is true if we have a URI to load, but no URL yet, and not currently uploading a new one.
          const isLoadingUrl = !!coverPhotoUri && actualImageUrl === undefined && !uploadingCoverPhoto;

          return (
            <View style={styles.sectionContent}> 
              {uploadingCoverPhoto || isLoadingUrl ? (
                <ActivityIndicator size="large" color="#007AFF" style={{ marginVertical: 20, alignSelf: 'center' }}/>
              ) : actualImageUrl ? (
                <Image source={{ uri: actualImageUrl }} style={styles.coverImagePreview} />
              ) : (
                <View style={styles.noCoverPhotoContainer}> {/* Define this style or reuse */}
                  <Text style={styles.instructionText}>Please take or upload a photo for the cover page in the report.</Text>
                </View>
              )}
              {!uploadingCoverPhoto && (
                <View> {/* Wrapper for buttons */}
                  <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.actionButtonFullWidth} onPress={handlePickCoverPhoto} disabled={uploadingCoverPhoto}>
                      <UploadCloud stroke="#fff" width={18} height={18} style={{marginRight: 5}}/>
                      <Text style={styles.actionButtonText}>Upload Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButtonFullWidth} onPress={handleTakeCoverPhoto} disabled={uploadingCoverPhoto}>
                      <Camera stroke="#fff" width={18} height={18} style={{marginRight: 5}}/>
                      <Text style={styles.actionButtonText}>Take Photo</Text>
                    </TouchableOpacity>
                  </View>
                  {coverPhotoUri && ( // Only show remove if there's a photo (i.e., coverPhotoUri/storageId exists)
                    <TouchableOpacity 
                      style={[styles.removeImageButton]} 
                      onPress={handleRemoveCoverPhoto} 
                      disabled={uploadingCoverPhoto}
                    >
                      <Trash2 stroke="#FF3B30" width={16} height={16} style={{marginRight: 5}}/>
                      <Text style={styles.removeImageButtonText}>Remove Photo</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          );
        }
        case "siteDescription":
          if (isEditingSiteDescription) {
            return (
              <View style={styles.sectionContent}>
                <TextInput
                  style={styles.noteInput}
                  multiline
                  placeholder="Enter site description..."
                  value={currentSiteDescriptionInput}
                  onChangeText={setCurrentSiteDescriptionInput}
                />
                <TouchableOpacity style={styles.saveNoteButton} onPress={() => {
                  updateSiteDescriptionMutation({
                    projectId: projectId as Id<"projects">,
                    text: currentSiteDescriptionInput,
                  });
                  setSiteDescriptionText(currentSiteDescriptionInput);
                  setIsEditingSiteDescription(false);
                  Alert.alert("Success", "Site description updated!");
                }}>
                  <Text style={styles.saveNoteText}>Save Site Description</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.editButton, styles.cancelButton, {marginTop: 10, alignSelf: 'center'}]} onPress={() => setIsEditingSiteDescription(false)}>
                    <X stroke="#fff" width={18} height={18} /><Text style={styles.editButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            );
          }
          return (
            <View style={styles.sectionContent}>
              <Text style={styles.detailsText}>
                {siteDescriptionText || "No site description yet. Add one below."}
              </Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.actionButtonFullWidth} onPress={() => setIsEditingSiteDescription(true)}>
                    <Text style={styles.actionButtonText}>Type Note</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.actionButtonFullWidth, 
                    isGenericRecording && genericRecordingSectionKey === "siteDescription" && styles.recordingActiveButton
                  ]}
                  onPress={() => {
                    if (isGenericRecording && genericRecordingSectionKey === "siteDescription") {
                      stopGenericRecording();
                    } else {
                      startGenericRecording("siteDescription");
                    }
                  }}
                >
                  {isGenericRecording && genericRecordingSectionKey === "siteDescription" ? (
                    <StopCircle stroke="#fff" width={18} height={18} style={{marginRight: 5}} />
                  ) : (
                    <Mic stroke="#fff" width={18} height={18} style={{marginRight: 5}} />
                  )}
                  <Text style={styles.actionButtonText}>
                    {isGenericRecording && genericRecordingSectionKey === "siteDescription" ? "Stop Recording" : "Speak Note"}
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.aiButton}><Text style={styles.aiButtonText}>AI Draft</Text></TouchableOpacity>
            </View>
          );
        case "scopeOfEvaluation":
          if (isEditingScopeOfEvaluation) {
            return (
              <View style={styles.sectionContent}>
                <TextInput
                  style={styles.noteInput}
                  multiline
                  placeholder="Enter scope of evaluation..."
                  value={currentScopeOfEvaluationInput}
                  onChangeText={setCurrentScopeOfEvaluationInput}
                />
                <TouchableOpacity style={styles.saveNoteButton} onPress={() => {
                  updateScopeOfEvaluationMutation({
                    projectId: projectId as Id<"projects">,
                    text: currentScopeOfEvaluationInput,
                  });
                  setScopeOfEvaluationText(currentScopeOfEvaluationInput);
                  setIsEditingScopeOfEvaluation(false);
                  Alert.alert("Success", "Scope of evaluation updated!");
                }}>
                  <Text style={styles.saveNoteText}>Save Scope</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.editButton, styles.cancelButton, {marginTop: 10, alignSelf: 'center'}]} onPress={() => setIsEditingScopeOfEvaluation(false)}>
                    <X stroke="#fff" width={18} height={18} /><Text style={styles.editButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            );
          }
          return (
            <View style={styles.sectionContent}>
              <Text style={styles.detailsText}>
                {scopeOfEvaluationText || "No scope of evaluation yet. Add one below."}
              </Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.actionButtonFullWidth} onPress={() => setIsEditingScopeOfEvaluation(true)}>
                  <Text style={styles.actionButtonText}>Type Note</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.actionButtonFullWidth, 
                    isGenericRecording && genericRecordingSectionKey === "scopeOfEvaluation" && styles.recordingActiveButton
                  ]}
                  onPress={() => {
                    if (isGenericRecording && genericRecordingSectionKey === "scopeOfEvaluation") {
                      stopGenericRecording();
                    } else {
                      startGenericRecording("scopeOfEvaluation");
                    }
                  }}
                >
                  {isGenericRecording && genericRecordingSectionKey === "scopeOfEvaluation" ? (
                    <StopCircle stroke="#fff" width={18} height={18} style={{marginRight: 5}} />
                  ) : (
                    <Mic stroke="#fff" width={18} height={18} style={{marginRight: 5}} />
                  )}
                  <Text style={styles.actionButtonText}>
                    {isGenericRecording && genericRecordingSectionKey === "scopeOfEvaluation" ? "Stop Recording" : "Speak Note"}
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.aiButton}><Text style={styles.aiButtonText}>AI Draft</Text></TouchableOpacity>
            </View>
          );
        case "conclusions":
          if (isEditingConclusions) {
            return (
              <View style={styles.sectionContent}>
                <TextInput
                  style={styles.noteInput}
                  multiline
                  placeholder="Enter conclusions..."
                  value={currentConclusionsInput}
                  onChangeText={setCurrentConclusionsInput}
                />
                <TouchableOpacity style={styles.saveNoteButton} onPress={() => {
                  updateConclusionsMutation({
                    projectId: projectId as Id<"projects">,
                    text: currentConclusionsInput,
                  });
                  setConclusionsText(currentConclusionsInput);
                  setIsEditingConclusions(false);
                  Alert.alert("Success", "Conclusions updated!");
                }}>
                  <Text style={styles.saveNoteText}>Save Conclusions</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.editButton, styles.cancelButton, {marginTop: 10, alignSelf: 'center'}]} onPress={() => setIsEditingConclusions(false)}>
                    <X stroke="#fff" width={18} height={18} /><Text style={styles.editButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            );
          }
          return (
            <View style={styles.sectionContent}>
              <Text style={styles.detailsText}>
                {conclusionsText || "No conclusions yet. Add them below."}
              </Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.actionButtonFullWidth} onPress={() => setIsEditingConclusions(true)}>
                  <Text style={styles.actionButtonText}>Type Note</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.actionButtonFullWidth, 
                    isGenericRecording && genericRecordingSectionKey === "conclusions" && styles.recordingActiveButton
                  ]}
                  onPress={() => {
                    if (isGenericRecording && genericRecordingSectionKey === "conclusions") {
                      stopGenericRecording();
                    } else {
                      startGenericRecording("conclusions");
                    }
                  }}
                >
                  {isGenericRecording && genericRecordingSectionKey === "conclusions" ? (
                    <StopCircle stroke="#fff" width={18} height={18} style={{marginRight: 5}} />
                  ) : (
                    <Mic stroke="#fff" width={18} height={18} style={{marginRight: 5}} />
                  )}
                  <Text style={styles.actionButtonText}>
                    {isGenericRecording && genericRecordingSectionKey === "conclusions" ? "Stop Recording" : "Speak Note"}
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.aiButton}><Text style={styles.aiButtonText}>AI Draft</Text></TouchableOpacity>
            </View>
          );
        case "recommendations":
          return (
            <View style={styles.sectionContent}>
              <Text style={styles.instructionText}>Add more details here, or leave it blank. Use *AI Draft* below.</Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.actionButtonFullWidth}><Text style={styles.actionButtonText}>Type Note</Text></TouchableOpacity>
                <TouchableOpacity style={styles.actionButtonFullWidth}><Text style={styles.actionButtonText}>Speak Note</Text></TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.addButton} /* onPress={addNewRecommendation} // TODO */ >
                <ChevronUp stroke="#2D74FF" width={20} height={20} style={{ transform: [{ rotate: "45deg" }] }} />
                <Text style={styles.addButtonText}>Add new recommendation</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.aiButton}><Text style={styles.aiButtonText}>AI Draft</Text></TouchableOpacity>
            </View>
          );
      }
    }
    return null; // Should not happen if data is structured correctly
  };
  
  // Render section headers for SectionList
  const renderSectionHeader = ({ section }: { section: Section }) => (
    <TouchableOpacity onPress={() => toggleSection(section.key)} style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      {expandedSections[section.key] ? (
        <ChevronUp stroke="#1E6FFF" width={24} height={24} />
      ) : (
        <ChevronDown stroke="#1E6FFF" width={24} height={24} />
      )}
    </TouchableOpacity>
  );
  
  // Main component render
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: projectData?.name || "Loading Project...",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ paddingLeft: 10 }}>
              <ChevronLeft stroke="#1E6FFF" width={28} height={28} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={() => {/* Navigate to settings or similar */}} style={{ paddingRight: 10 }}>
              <Settings stroke="#1E6FFF" width={24} height={24} />
            </TouchableOpacity>
          ),
        }}
      />
      <SectionList
        style={{ flex: 1 }}
        sections={sectionsData}
        keyExtractor={(item, index) => {
          if (typeof item === 'object' && item && 'id' in item && typeof (item as any).id === 'string') {
            return (item as any).id + index;
          }
          if (typeof item === 'object' && item && 'id' in item && typeof (item as any).id === 'string' && (item as any).type) {
             return (item as any).type + '-' + (item as any).id;
          }
          return String(index);
        }}
        renderItem={renderSectionListItem}
        renderSectionHeader={renderSectionHeader}
        ListHeaderComponent={<ListHeader />}
        ListFooterComponent={<ListFooter />}
        stickySectionHeadersEnabled={false}
        extraData={{expandedSections, observationsLength: observations.length, projectDetails, isRecording, recordingForObservationId, isGenericRecording, genericRecordingSectionKey, isTranscribing}}
        ListEmptyComponent={null}
        contentContainerStyle={{padding: 16}} // Add padding around entire list
      />

      {/* Area Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showAreaModal}
        onRequestClose={() => setShowAreaModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Area</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter Area Name, e.g. 'Roof', 'Living Room', 'Unit 101', etc."
              value={areaName}
              onChangeText={setAreaName}
            />
            <TouchableOpacity style={[styles.modalActionButton, { backgroundColor: "#2D74FF" }]}>
              <Text style={styles.modalActionButtonText}>Speak</Text>
            </TouchableOpacity>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalActionButton, styles.modalCancelButton]} onPress={() => setShowAreaModal(false)}>
                <Text style={[styles.modalActionButtonText, styles.modalCancelText]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalActionButton, { backgroundColor: "#2D74FF" }]}
                onPress={() => { console.log("Area Name:", areaName); setAreaName(""); setShowAreaModal(false); }}
              >
                <Text style={styles.modalActionButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* NEW: Modal for displaying WebView */}
      {showReportModal && reportUrl && (
        <Modal
          animationType="slide"
          transparent={false}
          visible={showReportModal}
          onRequestClose={() => {
            setShowReportModal(false);
            setReportUrl(null);
          }}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Generated Report</Text>
              <TouchableOpacity 
                onPress={async () => {
                  if (reportUrl) {
                    try {
                      await Sharing.shareAsync(reportUrl);
                    } catch (error) {
                      Alert.alert("Share Error", "Could not share the report.");
                    }
                  }
                }}
                style={styles.modalHeaderButton}
              >
                <Share2 stroke="#007AFF" width={24} height={24} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => {
                  setShowReportModal(false);
                  setReportUrl(null);
                }}
                style={styles.modalHeaderButton}
              >
                <X stroke="#007AFF" width={24} height={24} />
              </TouchableOpacity>
            </View>
            <WebView
              source={{ uri: reportUrl }}
              style={{ flex: 1 }}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.warn('WebView error: ', nativeEvent);
                Alert.alert("WebView Error", `Failed to load report: ${nativeEvent.description}`);
              }}
              onLoadStart={() => console.log("WebView loading started for: " + reportUrl)}
              onLoadEnd={() => console.log("WebView loading finished")}
            />
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
}

// Styles (Adapted from existing StyleSheet)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F9FF", // Updated to light blue background from design
  },
  headerContainer: {
    backgroundColor: "white",
    paddingHorizontal: 16, 
    paddingTop: Platform.OS === 'ios' ? 10 : 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  mainScreenTitle: {
    fontSize: 28, 
    fontWeight: "bold",
    color: "#0F1A4A", // Updated to match design
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0F1A4A", // Updated to match design
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  userInitial: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#4B5563"
  },
  detailsContainer: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 20,
    backgroundColor: "white",
    borderRadius: 12, // Added rounded corners from design
    marginBottom: 16, // Added spacing
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  detailsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0F1A4A", // Updated to match design
  },
  detailsActionsOnTopInEdit: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailsHeaderRowNonEditing: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  currentSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F1A4A', // Updated to match design
  },
  detailsActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionIcon: {
    marginLeft: 20,
  },
  detailsContent: {
    marginTop: 8,
  },
  detailsText: {
    fontSize: 15,
    marginBottom: 10,
    color: "#0F1A4A", // Updated to match design
    lineHeight: 24,
  },
  editDetailsForm: {
    marginTop: 8,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    marginBottom: 6,
    color: "#6B7280", // Lighter label text color from design
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8, // Increased roundness
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  editActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20, // Updated to pill shape from design
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: "#6B7280",
  },
  saveButton: {
    backgroundColor: "#1E6FFF", // Updated to match design
  },
  editButtonText: {
    color: "white",
    marginLeft: 6,
    fontWeight: '600',
    fontSize: 15,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#F5F9FF", // Updated to match design
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eeeeee',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F1A4A", // Updated to match design
    flex: 1,
  },
  sectionContent: {
    padding: 16,
    backgroundColor: "white",
  },
  observationItem: {
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 16,
    backgroundColor: '#FFFDF5', // Light amber background for observations
    borderRadius: 8,
    padding: 12,
  },
  observationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  observationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: "#0F1A4A", 
    flex: 1,
  },
  observationContent: {
    marginBottom: 16,
    fontSize: 15,
    color: "#4B5563",
    lineHeight: 22,
  },
  observationImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 8,
  },
  actionButtonFullWidth: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: "#1E6FFF",
    paddingVertical: 12,
    borderRadius: 20,
  },
  actionButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 15,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  addButtonText: {
    color: "#1E6FFF", // Updated to match design
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 6,
  },
  instructionText: {
    fontSize: 14,
    marginBottom: 16,
    color: "#6B7280", // Lighter text color from design
    lineHeight: 22,
  },
  aiButton: {
    borderWidth: 1,
    borderColor: "#1E6FFF", // Updated to match design
    borderRadius: 20, // Updated to pill shape from design
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
    backgroundColor: '#FFFFFF'
  },
  aiButtonText: {
    color: "#1E6FFF", // Updated to match design
    fontWeight: '500',
    fontSize: 15,
  },
  bottomActionsContainerOuter: {
    backgroundColor: 'white',
    paddingTop: 10,
  },
  bottomActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 20 : 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  bottomActionsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  bottomButtons: {
    flexDirection: "row",
    gap: 10,
  },
  customizeButton: {
    backgroundColor: "#e9ecef",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  customizeButtonText: {
    color: "#111827",
    fontWeight: '600',
    fontSize: 15,
  },
  generateButton: {
    backgroundColor: "#1E6FFF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  generateButtonText: {
    color: "white",
    fontWeight: '600',
    fontSize: 15,
  },
  noteInputContainer: {
    marginTop: 12,
    marginBottom: 16,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8, // Increased roundness
    padding: 12,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 10,
    fontSize: 15,
    lineHeight: 20,
  },
  saveNoteButton: {
    backgroundColor: "#1E6FFF", // Updated to match design
    paddingVertical: 10,
    borderRadius: 20, // Updated to pill shape from design
    alignItems: "center",
  },
  saveNoteText: {
    color: "white",
    fontWeight: "600",
    fontSize: 15,
  },
  coverImagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#e0e0e0',
  },
  removeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBEE',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  removeImageButtonText: {
    color: '#D32F2F',
    fontWeight: '600',
    fontSize: 15,
    marginLeft: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: "#111827",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  modalActionButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
    flex: 1,
  },
  modalActionButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    gap: 10,
  },
  modalCancelButton: {
    backgroundColor: "#6B7280",
  },
  modalCancelText: {
    color: "white",
  },
  disabledButton: { // Style for disabled save button
    backgroundColor: "#A5B4FC", // Lighter blue or gray
  },
  recordingActiveButton: { // Style for active recording button
    backgroundColor: "#FF3B30", // Red color to indicate recording
  },
  audioPlayerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 10,
    marginBottom: 10,
  },
  audioPlayerText: {
    fontSize: 14,
    color: '#333',
    marginRight: 8,
  },
  audioUriText: {
    flex: 1,
    fontSize: 13,
    color: '#555',
  },
  removeAudioButton: {
    padding: 6,
    marginLeft: 8,
  },
  noCoverPhotoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    alignItems: "center", // Center button if it's the only item
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1E6FFF", // Updated to match design
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20, // Updated to pill shape from design
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    width: '100%',
  },
  generateReportButton: {
    backgroundColor: "#1E6FFF", // Updated to match design
  },
  reportLinkContainer: { // New style for the link container
    marginTop: 15,
    paddingVertical: 10,
  },
  reportLinkText: { // New style for the link text
    fontSize: 16,
    color: "#007AFF", // Standard blue link color
    textDecorationLine: "underline",
    textAlign: "center",
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    backgroundColor: '#f8f8f8', // Light background for header
  },
  modalHeaderButton: {
    padding: 8, // Add some padding to make icons easier to tap
  },
  detailItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailItemLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  detailItemValue: {
    fontSize: 15,
    color: '#0F1A4A',
  },
  projectTypeBadge: {
    backgroundColor: '#1E6FFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  projectTypeBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailsListContainer: {
    marginTop: 16,
  },
}); 

