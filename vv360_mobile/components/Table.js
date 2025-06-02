// components/Table.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import theme from '../constants/theme';

const Table = ({ data, columns, itemsPerPage = 6 }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.ceil(data.length / itemsPerPage);

    const paginatedData = data.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const getVisiblePages = () => {
        if (totalPages <= 3) return [...Array(totalPages)].map((_, i) => i + 1);
        if (currentPage === 1) return [1, 2, 3];
        if (currentPage === totalPages) return [totalPages - 2, totalPages - 1, totalPages];
        return [currentPage - 1, currentPage, currentPage + 1];
    };

    return (
        <View style={styles.tableWrapper}>
            {/* Header */}
            <View style={styles.tableHeader}>
                {columns.map((col, index) => (
                    <Text key={index} style={styles.headerCell}>{col.label}</Text>
                ))}
            </View>

            {/* Rows */}
            {paginatedData.map((item, index) => (
                <View key={index} style={styles.tableRow}>
                    {columns.map((col, colIndex) => (
                        <Text key={colIndex} style={styles.cell} numberOfLines={2}>
                            {col.key === 'serial' ? (
                                <Text numberOfLines={2}>
                                    {String((currentPage - 1) * itemsPerPage + index + 1).padStart(2, '0')}
                                </Text>
                            ) : col.key === 'print' ? (
                                <TouchableOpacity
                                    style={styles.reprintBtn}
                                >
                                    <Text style={styles.reprintBtnText}>Reprint</Text>
                                </TouchableOpacity>
                            ) : (
                                <Text numberOfLines={2}>{item[col.key]}</Text>
                            )}
                        </Text>
                    ))}
                </View>
            ))}

            {/* Pagination Controls */}
            <View style={styles.pagination}>
                <TouchableOpacity onPress={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
                    <Text style={styles.pageControl}>{'<<'}</Text>
                </TouchableOpacity>

                {getVisiblePages().map(page => (
                    <TouchableOpacity key={page} onPress={() => setCurrentPage(page)}>
                        <Text style={[styles.pageNumber, currentPage === page && styles.activePage]}>{page}</Text>
                    </TouchableOpacity>
                ))}

                <TouchableOpacity onPress={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
                    <Text style={styles.pageControl}>{'>>'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    tableWrapper: { marginTop: 30, borderRadius: 10 },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f0a028',
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        padding: 10,
        paddingVertical: 15,
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 10,
        borderBottomWidth: 0.5,
        borderColor: '#D3D3D3',
    },
    headerCell: {
        flex: 1,
        color: '#fff',
        fontFamily: theme.fonts.dmBold,
        fontSize: 12,
        textAlign: 'center',
    },
    cell: {
        flex: 1,
        fontSize: 12,
        fontFamily: theme.fonts.dmRegular,
        color: '#444',
        textAlign: 'center',
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        gap: 10,
    },
    pageNumber: {
        fontSize: 13,
        fontFamily: theme.fonts.dmBold,
        paddingHorizontal: 8,
        paddingVertical: 2,
        color: '#555',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    activePage: {
        backgroundColor: '#f48e16',
        color: '#fff',
        borderColor: '#f48e16',
    },
    pageControl: {
        fontSize: 20,
        color: '#444',
        paddingHorizontal: 6,
    },
    reprintBtnText:{
        color:'#1F9254',
        fontFamily: theme.fonts.dmMedium,
        fontSize:12,
    }
});

export default Table;
