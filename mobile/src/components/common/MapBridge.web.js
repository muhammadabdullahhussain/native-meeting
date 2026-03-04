import React from 'react';
import { View, Text } from 'react-native';

export const Marker = ({ children }) => <View>{children}</View>;
export const Callout = ({ children }) => <View>{children}</View>;

const MapView = ({ children, style }) => (
    <View style={[style, { backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#94A3B8', fontWeight: 'bold' }}>Map View (Not supported in Browser)</Text>
    </View>
);

export default MapView;
