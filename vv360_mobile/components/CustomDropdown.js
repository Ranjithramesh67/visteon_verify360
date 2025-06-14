import React, { useState, useEffect } from 'react';
import {
    View, TextInput, FlatList, Text, TouchableOpacity,
    StyleSheet, Modal, TouchableWithoutFeedback, Keyboard
} from 'react-native';
import { COLORS } from '../constants/colors';

const CustomDropdown = ({ items, placeholder, onSelect, selectedValue }) => {
    const [filteredItems, setFilteredItems] = useState(items);
    const [search, setSearch] = useState('');
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        if (search === '') {
            setFilteredItems(items);
        } else {
            const results = items.filter(item =>
                item.label.toLowerCase().includes(search.toLowerCase())
            );
            setFilteredItems(results);
        }
    }, [search, items]);

    const handleSelect = (value) => {
        onSelect(value);
        setModalVisible(false);
        setSearch('');
    };

    return (
        <View style={{ flex: 1 }}>
            <TouchableOpacity
                onPress={() => setModalVisible(true)}
                style={styles.dropdownButton}
            >
                <Text style={styles.dropdownText}>{selectedValue || placeholder}</Text>
            </TouchableOpacity>

            <Modal
                transparent
                visible={modalVisible}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
                    <View style={styles.modalOverlay} />
                </TouchableWithoutFeedback>

                <View style={styles.modalContent}>
                    <TextInput
                        placeholder="Search Part Number..."
                        value={search}
                        onChangeText={setSearch}
                        style={styles.searchInput}
                    />
                    <FlatList
                        data={filteredItems}
                        keyExtractor={(item, index) => index.toString()}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                onPress={() => handleSelect(item.value)}
                                style={styles.item}
                            >
                                <Text>{item.label}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    dropdownButton: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 12,
        backgroundColor: COLORS.white,
    },
    dropdownText: {
        color: '#333',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    modalContent: {
        position: 'absolute',
        top: '25%',
        left: '5%',
        right: '5%',
        maxHeight: '50%',
        backgroundColor: COLORS.white,
        borderRadius: 8,
        padding: 10,
        elevation: 10,
    },
    searchInput: {
        padding: 10,
        borderBottomWidth: 1,
        borderColor: '#ccc',
        marginBottom: 10,
        borderRadius: 5,
    },
    item: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
});

export default CustomDropdown;
