import RNFS from 'react-native-fs';


// Sathish
const URL = "http://192.168.126.166:6005";

// sathiya
// const URL = "http://192.168.31.217:6005";
// const URL = "http://192.168.200.44:3001";
// const URL = "http://192.168.100.165:3001";

// const URL = "https://c2dapi.xdrtech.com";

const DB_NAME = 'visteonApp.db';
const APP_PACKAGE_NAME = 'com.visteon3';

const Config = {
    API_URL: `${URL}/api`,
    IMAGE_BASE_URL: URL,


    DB_NAME,
    DB_SOURCE_PATH: `/data/data/com.visteon3/databases/${DB_NAME}`,
    DB_BACKUP_DIR: RNFS.ExternalDirectoryPath + '/visteon',
    DB_BACKUP_PATH: RNFS.ExternalDirectoryPath + `/visteon/${DB_NAME}`,
};

export default Config;
