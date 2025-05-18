import { Ionicons } from '@expo/vector-icons'; // Assuming @expo/vector-icons is available
import { useMutation } from 'convex/react'; // Import useMutation
import { Stack, useRouter } from 'expo-router'; // Ensure Stack is imported from expo-router
import React, { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { api } from '../../convex/_generated/api'; // Import your API

const preBuiltTemplates = [
  { id: '1', title: 'Basic Field Report', description: 'A simple report to document field notes' },
  { id: '2', title: 'Structural Evaluation', description: 'Assess the condition, integrity, and performance of a structure to identify issues and recommend repairs or improvements.' },
  { id: '3', title: 'Forensic Evaluation', description: 'Assess structural failures, defects, or damages to determine causes and liability, often for legal or insurance purposes' },
  { id: '4', title: 'GC Daily Field Report', description: 'Daily field report for contractors to document site activities, progress, and issues.' },
  { id: '5', title: 'GC Punch List', description: 'Detailed checklist / punch list for contractors to track construction project tasks and deficiencies' },
  { id: '6', title: 'Construction Site Visit', description: 'For capturing key observations of site conditions and work progress' },
  { id: '7', title: 'Property Condition Assessment', description: 'For evaluating commercial and residential property conditions' },
  { id: '8', title: 'Balcony Inspection', description: 'For evaluating the condition of balconies and decks, including structural integrity and safety concerns.' },
  { id: '9', title: 'Cleaning Inspection', description: 'For cleaning inspection or job site observation' },
  { id: '10', title: 'Restoration', description: 'For restoration from emergency such as water damage, fire damage, mold remediation, etc.' },
  { id: '11', title: 'HVAC Inspection Report', description: 'For inspecting HVAC systems and components' },
  { id: '12', title: 'Job Site Observation', description: 'For assessing on-site activities and potential safety issues' },
  { id: '13', title: 'Safety Inspection Report', description: 'For workplace safety compliance and hazard identification' },
  { id: '14', title: 'Site Walkthrough', description: 'Structured template for documenting construction site walkthroughs' },
  { id: '15', title: 'Mold Inspection', description: 'For evaluating moisture conditions and mold concerns' },
  { id: '16', title: 'Home Inspection', description: 'Home inspections for real estate transactions, including buying, selling, and property transfers.' },
];

const TemplatesScreen = () => {
  const router = useRouter();
  const createProject = useMutation(api.projects.createProjectFromTemplate);
  const [creatingProjectId, setCreatingProjectId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');

  const handleCreateProject = async (template: (typeof preBuiltTemplates)[0]) => {
    if (creatingProjectId) {
      console.log("Project creation already in progress for:", creatingProjectId);
      return;
    }

    console.log("Attempting to create project from template:", template.title);
    setCreatingProjectId(template.id);
    try {
      const projectName = `Project from ${template.title}`;
      // TODO: Replace with actual user ID when available from authentication
      const mockUserId = "user_placeholder_123"; 

      console.log(`Calling createProject mutation with: {name: "${projectName}", originalTemplateId: "${template.id}", originalTemplateTitle: "${template.title}", userId: "${mockUserId}"}`);
      const newProjectId = await createProject({
        name: projectName,
        originalTemplateId: template.id,
        originalTemplateTitle: template.title,
        userId: mockUserId,
      });

      if (!newProjectId) {
        console.error("Mutation returned no project ID for template:", template.title);
        throw new Error('Failed to create project: No project ID returned.');
      }

      console.log("Project created successfully with ID:", newProjectId);
      router.push({
        pathname: "/project/[id]",
        params: { id: String(newProjectId) },
      });
      // Resetting creatingProjectId is now primarily handled in finally,
      // but good to have a clear path if navigation is synchronous and successful.
      // setCreatingProjectId(null); // Moved to finally
    } catch (error: any) {
      console.error("Failed to create project from template:", template.title, "Error:", error);
      let errorMessage = "An unexpected error occurred.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error.message === 'string') {
        errorMessage = error.message;
      }
      Alert.alert("Error Creating Project", errorMessage);
      setCreatingProjectId(null); // Ensure reset on error, even if finally block is also there
    } finally {
      // Ensure creatingProjectId is always reset
      console.log("Resetting creatingProjectId in finally block. Was:", creatingProjectId);
      setCreatingProjectId(null);
    }
  };

  const filteredTemplates = preBuiltTemplates.filter(template =>
    template.title.toLowerCase().includes(searchText.toLowerCase())
  );

  const renderTemplateItem = ({ item }: { item: (typeof preBuiltTemplates)[0] }) => (
    <View style={styles.templateCard}>
      <View style={styles.templateInfo}>
        <Text style={styles.templateTitle}>{item.title}</Text>
        <Text style={styles.templateDescription}>{item.description}</Text>
      </View>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => handleCreateProject(item)}
        disabled={!!creatingProjectId} // Disable button if any project creation is in progress
      >
        {creatingProjectId === item.id ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : (
          <Ionicons name="add-circle" size={32} color="#007AFF" />
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Templates</Text>
      </View>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* My Templates Section */}
        <View style={styles.section}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search templates..."
            placeholderTextColor="#8A8A8E"
            value={searchText}
            onChangeText={setSearchText}
          />
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={24} color="#007AFF" style={styles.infoIcon} />
            <Text style={styles.infoText}>You have 1 trial projects left. We will email you for next steps after your trial ends.</Text>
          </View>
        </View>

        {/* Pre-Built Templates Section */}
        <View style={styles.section}>
          <Text style={styles.preBuiltSectionTitle}>Pre-Built Templates</Text>
          {filteredTemplates.length > 0 ? (
            <FlatList
              data={filteredTemplates}
              keyExtractor={(item) => item.id}
              renderItem={renderTemplateItem}
              scrollEnabled={false} // Important if the FlatList is inside a ScrollView
            />
          ) : (
            <Text style={styles.noTemplatesText}>No templates match your search.</Text>
          )}
        </View>
        
        {/* Spacer View */}
        <View style={{ height: 20 }} />

        <View style={styles.suggestSection}>
            <Text style={styles.suggestTitle}>Need a report template we don't have yet?</Text>
            <TouchableOpacity style={styles.suggestButton}>
                <Text style={styles.suggestButtonText}>Suggest a report template</Text>
            </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Changed to white
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20, // Increased horizontal padding
    paddingVertical: 20, // Increased vertical padding
    paddingTop: Platform.OS === 'ios' ? 20 : 25, // More top padding
    borderBottomWidth: 1,
    borderBottomColor: '#D1D1D6', // Light border color
    alignItems: 'flex-start', // Align title to the left
  },
  headerTitle: {
    fontSize: 28, // Larger font size for the title
    fontWeight: 'bold', // Standard iOS title weight
    color: '#000000',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20, // Space at the bottom
  },
  section: {
    marginTop: 8, // Space between header and first section
    backgroundColor: 'transparent', // Sections themselves are transparent
    paddingHorizontal: 16, // Horizontal padding for section content
  },
  sectionTitle: {
    fontSize: 22, // Larger section titles
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12, // Space below title
    marginTop: 20, // Space above title
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 17,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#D1D1D6', // Subtle border for the search input
    marginBottom: 16,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#D1D1D6', // Subtle border for the info box
  },
  infoIcon: {
    marginRight: 10,
  },
  infoText: {
    fontSize: 13, // Slightly smaller info text
    color: '#3C3C43',
    flex: 1,
    lineHeight: 18,
  },
  templateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12, // Rounded corners for cards
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12, // Space between cards
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, // Softer shadow
    shadowRadius: 3,
    // Elevation for Android
    elevation: 2,
  },
  templateInfo: {
    flex: 1,
    marginRight: 10, // Space between text and button
  },
  templateTitle: {
    fontSize: 17, // Prominent title
    fontWeight: '600', // Bolder title
    color: '#000000',
    marginBottom: 4, // Space between title and description
  },
  templateDescription: {
    fontSize: 13, // Smaller description text
    color: '#8A8A8E', // Softer color for description
    lineHeight: 18,
  },
  addButton: {
    padding: 4, // Touch area for the button
  },
  noTemplatesText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  suggestSection: {
    backgroundColor: '#FFFFFF', // White background for this distinct section
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16, // Consistent horizontal margin
    marginTop: 20, // Space above this section
    alignItems: 'center',
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    // Elevation for Android
    elevation: 2,
  },
  suggestTitle: {
    fontSize: 16, // Adjusted size
    fontWeight: '500', // Medium weight
    color: '#000000',
    marginBottom: 16,
    textAlign: 'center',
  },
  suggestButton: {
    backgroundColor: '#007AFF', // Primary action color
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  suggestButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  preBuiltSectionTitle: {
    fontSize: 22, 
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12, 
    marginTop: 20, 
    paddingTop: 20, // Add some padding above the title if it has a top border
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0', // Subtle grey line
  },
});

export default TemplatesScreen; 