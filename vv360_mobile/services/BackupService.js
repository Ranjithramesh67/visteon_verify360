import RNFS from 'react-native-fs';
import { PermissionsAndroid, Platform } from 'react-native';
import Config from './config';

const requestStoragePermission = async () => {
  if (Platform.OS === 'android' && Platform.Version < 30) {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      {
        title: 'Storage Permission',
        message: 'App needs access to save database backup to your phone.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  return true;
};


export const autoBackupDB = async () => {
  const hasPermission = await requestStoragePermission();
  if (!hasPermission) {
    console.log('❌ Storage permission denied');
    return;
  }

  try {
    const sourceExists = await RNFS.exists(Config.DB_SOURCE_PATH);
    if (!sourceExists) {
      console.log('❌ DB file does not exist at:', Config.DB_SOURCE_PATH);
      return;
    }

    const dirExists = await RNFS.exists(Config.DB_BACKUP_DIR);
    if (!dirExists) {
      await RNFS.mkdir(Config.DB_BACKUP_DIR);
      console.log('📁 Created backup folder:', Config.DB_BACKUP_DIR);
    }

    await RNFS.copyFile(Config.DB_SOURCE_PATH, Config.DB_BACKUP_PATH);
    console.log('✅ DB backup saved to:', Config.DB_BACKUP_PATH);
  } catch (err) {
    console.log('❌ DB backup error:', err.message);
  }
};

export const restoreBackupDB = async () => {
  try {
    const backupExists = await RNFS.exists(Config.DB_BACKUP_PATH);
    if (!backupExists) {
      console.log('❌ No backup found at:', Config.DB_BACKUP_PATH);
      return;
    }

    await RNFS.copyFile(Config.DB_BACKUP_PATH, Config.DB_SOURCE_PATH);
    console.log('✅ DB restored from backup');
  } catch (err) {
    console.log('❌ Restore failed:', err.message);
  }
};
