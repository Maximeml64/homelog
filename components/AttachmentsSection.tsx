// components/AttachmentsSection.tsx

import React, { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import {
  FileText,
  Paperclip,
  Plus,
} from 'lucide-react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';
import {
  createAttachment,
  deleteAttachment,
} from '../src/repositories/eventRepository';
import {
  persistAttachment,
  removePersistedAttachment,
} from '../src/utils/attachmentStorage';
import { logger } from '../src/utils/logger';
import { Attachment } from '../src/types';

interface Props {
  attachments: Attachment[];
  eventId?: string;
  assetId?: string;
  onChanged: () => void;
}

function getAttachmentLabel(attachment: Attachment): string {
  if (attachment.fileName) return attachment.fileName;
  if (attachment.type === 'photo') return 'Photo';
  return 'Document';
}

function isPdf(att: Attachment): boolean {
  return att.type === 'pdf' || !!att.mimeType?.includes('pdf');
}

export default function AttachmentsSection({
  attachments,
  eventId,
  assetId,
  onChanged,
}: Props) {
  const [loading, setLoading] = useState(false);

  async function handleAdd() {
    Alert.alert('Ajouter une pièce jointe', '', [
      { text: 'Appareil photo', onPress: handleCamera },
      { text: 'Galerie', onPress: handleGallery },
      { text: 'Document / PDF', onPress: handleDocument },
      { text: 'Annuler', style: 'cancel' },
    ]);
  }

  async function handleCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', "L'accès à la caméra est nécessaire.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
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
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', "L'accès à la galerie est nécessaire.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
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
      const isPdfMime = doc.mimeType?.includes('pdf');
      const isImage = doc.mimeType?.startsWith('image/');
      await saveAttachment({
        type: isPdfMime ? 'pdf' : isImage ? 'photo' : 'document',
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
      const persistedUri = await persistAttachment(data.uri, data.fileName);
      await createAttachment({
        eventId,
        assetId,
        type: data.type,
        uri: persistedUri,
        mimeType: data.mimeType,
        fileName: data.fileName,
      });
      onChanged();
    } catch (e) {
      logger.error('AttachmentsSection', 'saveAttachment failed', e);
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
    } catch (e) {
      logger.warn('AttachmentsSection', 'shareAsync failed', e);
      Alert.alert('Erreur', "Impossible d'ouvrir ce fichier.");
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
            await removePersistedAttachment(attachment.uri);
            onChanged();
          },
        },
      ],
    );
  }

  return (
    <View>
      {attachments.length === 0 ? (
        <Pressable
          onPress={handleAdd}
          disabled={loading}
          style={({ pressed }) => [styles.emptyButton, pressed && { opacity: 0.6 }]}
        >
          <Paperclip
            size={16}
            color={COLORS.textTertiary}
            strokeWidth={1.75}
          />
          <Text style={styles.emptyText}>
            Photos, factures, garanties…
          </Text>
          <Plus
            size={14}
            color={COLORS.textSecondary}
            strokeWidth={2}
          />
        </Pressable>
      ) : (
        <View style={styles.list}>
          {attachments.map((attachment) => (
            <Pressable
              key={attachment.id}
              style={({ pressed }) => [
                styles.item,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => handleOpen(attachment)}
              onLongPress={() => handleDelete(attachment)}
            >
              {attachment.type === 'photo' ? (
                <Image
                  source={attachment.uri}
                  style={styles.thumbnail}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  transition={150}
                  recyclingKey={attachment.uri}
                />
              ) : (
                <View style={styles.iconContainer}>
                  {isPdf(attachment) ? (
                    <FileText
                      size={20}
                      color={COLORS.textSecondary}
                      strokeWidth={1.5}
                    />
                  ) : (
                    <Paperclip
                      size={20}
                      color={COLORS.textSecondary}
                      strokeWidth={1.5}
                    />
                  )}
                </View>
              )}
              <Text style={styles.itemLabel} numberOfLines={1}>
                {getAttachmentLabel(attachment)}
              </Text>
            </Pressable>
          ))}
          <Pressable
            onPress={handleAdd}
            disabled={loading}
            style={({ pressed }) => [
              styles.addTile,
              pressed && { opacity: 0.6 },
            ]}
          >
            <Plus
              size={20}
              color={COLORS.textSecondary}
              strokeWidth={1.75}
            />
            <Text style={styles.addTileText}>Ajouter</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.base,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
  },
  emptyText: {
    flex: 1,
    fontFamily: FONTS.sans,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  item: {
    alignItems: 'center',
    width: 72,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.sm,
    marginBottom: 4,
    backgroundColor: COLORS.surfaceAlt,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemLabel: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: 'center',
    width: 64,
  },
  addTile: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  addTileText: {
    fontFamily: FONTS.sansMedium,
    fontSize: 10,
    color: COLORS.textSecondary,
  },
});
