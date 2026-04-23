// components/AttachmentsSection.tsx

import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import {
    Alert,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { colors, fontSize, fontWeight, radius, shadow, spacing } from '../constants/theme';
import {
    createAttachment,
    deleteAttachment,
} from '../src/repositories/eventRepository';
import { Attachment } from '../src/types';

interface Props {
  attachments: Attachment[];
  eventId?: string;
  assetId?: string;
  onChanged: () => void;
}

function getAttachmentIcon(type: string, mimeType?: string): string {
  if (type === 'photo') return '🖼️';
  if (mimeType?.includes('pdf')) return '📄';
  return '📎';
}

function getAttachmentLabel(attachment: Attachment): string {
  if (attachment.fileName) return attachment.fileName;
  if (attachment.type === 'photo') return 'Photo';
  return 'Document';
}

export default function AttachmentsSection({ attachments, eventId, assetId, onChanged }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleAdd() {
    Alert.alert(
      'Ajouter une pièce jointe',
      '',
      [
        {
          text: '📷 Appareil photo',
          onPress: handleCamera,
        },
        {
          text: '🖼️ Galerie',
          onPress: handleGallery,
        },
        {
          text: '📄 Document / PDF',
          onPress: handleDocument,
        },
        {
          text: 'Annuler',
          style: 'cancel',
        },
      ]
    );
  }

  async function handleCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', "L'accès à la caméra est nécessaire.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) {
      await saveAttachment({
        type: 'photo',
        uri: result.assets[0].uri,
        mimeType: 'image/jpeg',
        fileName: `photo_${Date.now()}.jpg`,
      });
    }
  }

  async function handleGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', "L'accès à la galerie est nécessaire.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      const isImage = asset.mimeType?.startsWith('image/');
      await saveAttachment({
        type: isImage ? 'photo' : 'document',
        uri: asset.uri,
        mimeType: asset.mimeType ?? 'application/octet-stream',
        fileName: asset.fileName ?? `fichier_${Date.now()}`,
      });
    }
  }

  async function handleDocument() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*', '*/*'],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets[0]) {
      const doc = result.assets[0];
      const isPdf = doc.mimeType?.includes('pdf');
      const isImage = doc.mimeType?.startsWith('image/');
      await saveAttachment({
        type: isPdf ? 'pdf' : isImage ? 'photo' : 'document',
        uri: doc.uri,
        mimeType: doc.mimeType ?? 'application/octet-stream',
        fileName: doc.name,
      });
    }
  }

  async function saveAttachment(data: {
    type: 'photo' | 'pdf' | 'document';
    uri: string;
    mimeType: string;
    fileName: string;
  }) {
    setLoading(true);
    try {
      await createAttachment({
        eventId,
        assetId,
        type: data.type,
        uri: data.uri,
        mimeType: data.mimeType,
        fileName: data.fileName,
      });
      onChanged();
    } catch (e: any) {
      Alert.alert('Erreur', 'Impossible de sauvegarder la pièce jointe.');
    } finally {
      setLoading(false);
    }
  }

  async function handleOpen(attachment: Attachment) {
    try {
      await Sharing.shareAsync(attachment.uri, {
        mimeType: attachment.mimeType ?? 'application/octet-stream',
        dialogTitle: getAttachmentLabel(attachment),
      });
    } catch {
      Alert.alert('Erreur', 'Impossible d\'ouvrir ce fichier.');
    }
  }

  function handleDelete(attachment: Attachment) {
    Alert.alert(
      'Supprimer',
      `Supprimer "${getAttachmentLabel(attachment)}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteAttachment(attachment.id);
            onChanged();
          },
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pièces jointes</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAdd}
          disabled={loading}
        >
          <Text style={styles.addButtonText}>+ Ajouter</Text>
        </TouchableOpacity>
      </View>

      {attachments.length === 0 ? (
        <TouchableOpacity style={styles.emptyButton} onPress={handleAdd}>
          <Text style={styles.emptyIcon}>📎</Text>
          <Text style={styles.emptyText}>
            Photos, factures, garanties…
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.list}>
          {attachments.map(attachment => (
            <TouchableOpacity
              key={attachment.id}
              style={styles.item}
              onPress={() => handleOpen(attachment)}
              onLongPress={() => handleDelete(attachment)}
            >
              {attachment.type === 'photo' ? (
                <Image
                  source={{ uri: attachment.uri }}
                  style={styles.thumbnail}
                />
              ) : (
                <View style={styles.iconContainer}>
                  <Text style={styles.icon}>
                    {getAttachmentIcon(attachment.type, attachment.mimeType)}
                  </Text>
                </View>
              )}
              <Text style={styles.itemLabel} numberOfLines={1}>
                {getAttachmentLabel(attachment)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadow.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  addButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  addButtonText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  emptyIcon: { fontSize: 20 },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  item: {
    alignItems: 'center',
    width: 72,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: radius.sm,
    marginBottom: 4,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  icon: { fontSize: 28 },
  itemLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
    width: 64,
  },
});