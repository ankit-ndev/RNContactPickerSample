/**
 * Recent Contacts App - Final Production Version
 *
 * Uses: react-native-pick-contact (idanlevi1)
 * https://github.com/idanlevi1/react-native-pick-contact
 *
 * Why this library:
 * - Modern ActivityResultContracts.PickContact() on Android
 * - CNContactPickerViewController on iOS
 * - Handles Samsung Android 16+ edge case with graceful fallback
 * - Full TurboModule + Codegen support (RN 0.76+)
 * - Published to npm with active maintenance
 *
 * Installation:
 *   npm install react-native-pick-contact react-native-swipe-list-view react-native-gesture-handler
 *   cd ios && pod install && cd ..
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';
import { pickContact } from 'react-native-pick-contact';

interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  timestamp: number;
}

const App: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);

  const handlePickContact = async () => {
    setLoading(true);
    try {
      const selectedContact = await pickContact();

      if (selectedContact === null) {
        return;
      }

      if (!selectedContact.phone || selectedContact.phone.trim() === '') {
        Alert.alert(
          'No Phone Number',
          `${selectedContact.name} has no phone number. Please select a different contact.`,
        );
        return;
      }

      const isDuplicate = contacts.some(
        contact => contact.phoneNumber === selectedContact.phone,
      );

      if (isDuplicate) {
        Alert.alert(
          'Already Added',
          `${selectedContact.name} is already in your recent contacts.`,
        );
        return;
      }

      const newContact: Contact = {
        id: Math.random().toString(36).substring(2, 11),
        name: selectedContact.name || 'Unknown',
        phoneNumber: selectedContact.phone,
        timestamp: Date.now(),
      };

      setContacts([newContact, ...contacts]);
      Alert.alert('Added', `${newContact.name} added to recent contacts`);
    } catch (error: any) {
      switch (error.code) {
        case 'E_PICKER_BUSY':
          Alert.alert(
            'Picker Busy',
            'Please wait for the previous picker to close',
          );
          break;
        case 'E_NO_ACTIVITY':
        case 'E_NO_VIEW_CONTROLLER':
          Alert.alert(
            'Error',
            'Could not open contact picker. Please try again.',
          );
          break;
        case 'E_LAUNCH_PICKER':
          Alert.alert('Error', 'Failed to launch contact picker');
          break;
        case 'E_CONTACT_RESOLVE':
          Alert.alert('Error', 'Could not read selected contact');
          break;
        default:
          Alert.alert('Error', error.message || 'Failed to pick contact');
          console.error('Contact picker error:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContact = (contactId: string) => {
    setContacts(prev => prev.filter(c => c.id !== contactId));
  };

  const handleClearAll = () => {
    if (contacts.length === 0) return;

    Alert.alert('Clear All Contacts', 'Delete all recent contacts?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete All',
        onPress: () => setContacts([]),
        style: 'destructive',
      },
    ]);
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .filter(word => word.length > 0)
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>👥</Text>
      <Text style={styles.emptyTitle}>No Recent Contacts</Text>
      <Text style={styles.emptySubtitle}>
        Tap "Pick Contact" to add your first contact
      </Text>
      <Text style={styles.privacyNote}>🔒 Zero-permission contact picker</Text>
    </View>
  );

  const renderContactItem = (item: Contact) => (
    <View style={styles.contactItem}>
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        <Text style={styles.contactPhone}>{item.phoneNumber}</Text>
      </View>
    </View>
  );

  const renderHiddenItem = (item: Contact) => (
    <TouchableOpacity
      style={styles.deleteButton}
      onPress={() => {
        Alert.alert('Delete Contact', `Remove ${item.name}?`, [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            onPress: () => handleDeleteContact(item.id),
            style: 'destructive',
          },
        ]);
      }}
    >
      <Text style={styles.deleteButtonText}>Delete</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recent Contacts</Text>
        <Text style={styles.headerSubtitle}>
          {contacts.length} contact{contacts.length !== 1 ? 's' : ''} •
          Privacy-first
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.pickButton]}
          onPress={handlePickContact}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text style={styles.buttonEmoji}>📞</Text>
              <Text style={styles.buttonText}>Pick Contact</Text>
            </>
          )}
        </TouchableOpacity>

        {contacts.length > 0 && (
          <TouchableOpacity
            style={[styles.button, styles.clearButton]}
            onPress={handleClearAll}
          >
            <Text style={styles.buttonEmoji}>🗑️</Text>
            <Text style={styles.buttonText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {contacts.length === 0 ? (
        renderEmptyState()
      ) : (
        <SwipeListView
          data={contacts}
          keyExtractor={item => item.id}
          renderItem={({ item }) => renderContactItem(item)}
          renderHiddenItem={({ item }) => renderHiddenItem(item)}
          rightOpenValue={-80}
          disableRightSwipe
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#34C759',
    marginTop: 4,
    fontWeight: '500',
  },
  buttonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  pickButton: {
    backgroundColor: '#007AFF',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  buttonEmoji: {
    fontSize: 18,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 20,
  },
  privacyNote: {
    fontSize: 12,
    color: '#34C759',
    marginTop: 24,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  separator: {
    height: 8,
  },
  contactItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 13,
    color: '#666666',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderRadius: 12,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default App;
