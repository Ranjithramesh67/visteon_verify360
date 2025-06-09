const fs = require('fs');
const path = require('path');
const projectRoot = process.cwd();
const patchesDir = path.join(projectRoot, 'patches');
const nodeModulesDir = path.join(projectRoot, 'node_modules');

const filesToPatch = [
    {
        source: path.join(patchesDir, 'RNBluetoothManagerModule.java'),
        destination: path.join(nodeModulesDir, 'react-native-bluetooth-escpos-printer', 'android', 'src', 'main', 'java', 'cn', 'jystudio', 'bluetooth', 'RNBluetoothManagerModule.java'),
    },
    {
        source: path.join(patchesDir, 'build.gradle'),
        destination: path.join(nodeModulesDir, 'react-native-bluetooth-escpos-printer', 'android', 'build.gradle'),
    },
];
console.log('\n--- Applying custom patches to react-native-bluetooth-escpos-printer ---');
filesToPatch.forEach(file => {
    if (!fs.existsSync(file.source)) {
        console.error(`ERROR: Source patch file not found: ${file.source}`);
        console.error('Please ensure your modified files are in the "patches" directory.');
        process.exit(1);
    }
    const destDir = path.dirname(file.destination);
    if (!fs.existsSync(destDir)) {
        console.error(`ERROR: Destination directory not found: ${destDir}`);
        console.error('This usually means "react-native-bluetooth-escpos-printer" was not installed correctly or its path has changed.');
        process.exit(1);
    } try {
        fs.copyFileSync(file.source, file.destination);
        console.log(`✓ Successfully patched: ${path.relative(projectRoot, file.destination)}`);
    } catch (error) {
        console.error(`✗ Error applying patch to ${path.relative(projectRoot, file.destination)}:`);
        console.error(error);
        process.exit(1);
    }
});
console.log('--- Custom patching complete ---');