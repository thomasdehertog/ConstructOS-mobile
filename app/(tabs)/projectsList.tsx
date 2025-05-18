import { useQuery } from 'convex/react';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Plus, Search } from 'react-native-feather';
import { api } from '../../convex/_generated/api';
import { Doc, Id } from '../../convex/_generated/dataModel';

type ProjectItem = Doc<"projects">;

export default function ProjectsListScreen() {
  const router = useRouter();
  const projectsData = useQuery(api.projects.getAllProjects, {});
  const [searchQuery, setSearchQuery] = useState('');

  const handleProjectPress = (projectId: Id<"projects">) => {
    router.push(`/project/${projectId}`);
  };

  const handleAddProjectPress = () => {
    router.push('/(tabs)/templates');
  };

  const filteredProjects = projectsData?.filter(project => 
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (project.siteName && project.siteName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (project.projectType && project.projectType.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderProjectItem = ({ item }: { item: ProjectItem }) => (
    <TouchableOpacity style={styles.projectCard} onPress={() => handleProjectPress(item._id)}>
      <View style={styles.cardHeader}>
        <Text style={styles.projectTitle}>{item.name}</Text>
      </View>
      <Text style={styles.projectInfo}>Type: {item.projectType || 'N/A'}</Text>
      <Text style={styles.projectInfo}>Site: {item.siteName || 'N/A'}</Text>
      <Text style={styles.projectInfoDate}>Created: {new Date(item._creationTime).toLocaleDateString()}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>All Projects</Text>
        <TouchableOpacity onPress={handleAddProjectPress} style={styles.addButton}>
          <Plus stroke="#2D74FF" width={28} height={28} />
        </TouchableOpacity>
      </View>
      <View style={styles.searchContainer}>
        <Search stroke="#888" width={20} height={20} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search projects by name, type, site..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#888"
        />
      </View>

      {projectsData === undefined && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2D74FF" />
          <Text style={styles.loadingText}>Loading projects...</Text>
        </View>
      )}

      {projectsData && filteredProjects && filteredProjects.length === 0 && searchQuery !== '' && (
         <View style={styles.centered}>
            <Text style={styles.emptyText}>No projects found matching "{searchQuery}".</Text>
         </View>
      )}
      
      {projectsData && filteredProjects && filteredProjects.length === 0 && searchQuery === '' && (
         <View style={styles.centered}>
            <Text style={styles.emptyText}>No projects yet. Create one from the Templates tab!</Text>
         </View>
      )}


      {filteredProjects && filteredProjects.length > 0 && (
        <FlatList
          data={filteredProjects}
          renderItem={renderProjectItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContentContainer}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: Platform.OS === 'ios' ? 20 : 25,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  addButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 8,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    height: 40,
  },
  listContentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  projectCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  projectInfo: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  projectInfoDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4B5563',
  },
  emptyText: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
  },
}); 