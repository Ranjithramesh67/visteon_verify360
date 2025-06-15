import React, { useState, useEffect } from 'react';
import {
    View,
    TextInput,
    FlatList,
    Text,
    TouchableOpacity,
    StyleSheet,
    Keyboard,
    TouchableWithoutFeedback,
    Dimensions,
    Modal
} from 'react-native';
import { COLORS } from '../constants/colors';
import theme from '../constants/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;

const CustomDropdown = ({ items, placeholder, onSelect, selectedValue }) => {
    const [filteredItems, setFilteredItems] = useState(items);
    const [search, setSearch] = useState('');
    const [dropdownVisible, setDropdownVisible] = useState(false);

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
        closeDropdown();
    };

    const toggleDropdown = () => {
        setDropdownVisible(prev => !prev);
        setSearch('');
    };

    const closeDropdown = () => {
        setDropdownVisible(false);
        setSearch('');
        Keyboard.dismiss();
    };

    return (
        <View style={styles.wrapper}>
            <TouchableOpacity onPress={toggleDropdown} style={styles.dropdownButton}>
                <Text style={styles.dropdownText}>{selectedValue || placeholder}</Text>
            </TouchableOpacity>

            {/* Use Modal for full-screen overlay and proper layering */}
            <Modal
                visible={dropdownVisible}
                transparent
                animationType="fade"
                onRequestClose={closeDropdown}
            >
                <TouchableWithoutFeedback onPress={closeDropdown}>
                    <View style={styles.overlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.dropdown}>
                                <TextInput
                                    placeholder="Search..."
                                    value={search}
                                    onChangeText={setSearch}
                                    style={styles.searchInput}
                                    autoFocus
                                />
                                <FlatList
                                    data={filteredItems}
                                    keyExtractor={(item, index) => index.toString()}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            onPress={() => handleSelect(item.value)}
                                            style={styles.item}
                                        >
                                            <Text style={{fontFamily: theme.fonts.dmMedium}}>{item.label}</Text>
                                        </TouchableOpacity>
                                    )}
                                    style={styles.list}
                                    nestedScrollEnabled={true}
                                    keyboardShouldPersistTaps="handled"
                                    ListEmptyComponent={
                                        <View style={styles.emptyContainer}>
                                            <Text style={styles.emptyText}>No data found</Text>
                                        </View>
                                    }
                                />

                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        position: 'relative',
        zIndex: 10,
        flex: 1,
    },
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
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dropdown: {
        width: SCREEN_WIDTH - 80,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 10,
        maxHeight: 300,
        // paddingBottom: 10,
        // paddingTop: 10,
    },
    searchInput: {
        padding: 15,
        borderBottomWidth: 1,
        borderColor: '#ccc',
    },
    item: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    list: {
        maxHeight: 220,
    },
    emptyContainer: {
        padding: 16,
        alignItems: 'center',
    },
    emptyText: {
        color: '#999',
        fontFamily: theme.fonts.dmMedium
    }

});

export default CustomDropdown;
