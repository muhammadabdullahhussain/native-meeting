import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme/theme';

export default function ChatRoom({ route, navigation }) {
    const { user, chatData } = route.params || {};
    const insets = useSafeAreaInsets();

    const initialMessages = chatData ? chatData.messages : [
        { id: 'm1', text: 'Hey there! How are you doing?', sender: 'them', time: '10:00 AM' }
    ];

    const [messages, setMessages] = useState(initialMessages);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const flatListRef = useRef(null);

    useEffect(() => {
        // If we just sent a message, simulate a realistic typing + reply sequence
        if (messages.length > 0 && messages[messages.length - 1].sender === 'me') {
            setIsTyping(true);
            const timer = setTimeout(() => {
                setIsTyping(false);
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    text: 'Haha, that\'s amazing! Catch up later?',
                    sender: 'them',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }]);
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [messages]);

    const sendMessage = () => {
        if (inputText.trim() === '') return;

        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            text: inputText.trim(),
            sender: 'me',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
        setInputText('');
    };

    const renderMessage = ({ item, index }) => {
        const isMe = item.sender === 'me';

        // Check if the previous message was from the same sender to adjust tail/radius
        const prevMessage = index > 0 ? messages[index - 1] : null;
        const isConsecutive = prevMessage && prevMessage.sender === item.sender;

        return (
            <View style={[
                styles.messageWrapper,
                isMe ? styles.messageWrapperMe : styles.messageWrapperThem,
                isConsecutive && { marginTop: 2 } // tighter spacing for consecutive messages
            ]}>
                <View style={[
                    styles.messageBubble,
                    isMe ? styles.messageMe : styles.messageThem,
                    isConsecutive && (isMe ? styles.messageMeConsecutive : styles.messageThemConsecutive)
                ]}>
                    <Text style={[styles.messageText, isMe && styles.messageTextMe]}>{item.text}</Text>
                    <Text style={[styles.messageTime, isMe && styles.messageTimeMe]}>{item.time}</Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.safeContainer}>
            {/* Premium Gradient Header */}
            <LinearGradient
                colors={['#E8F2FF', '#FFFFFF']}
                style={[styles.header, { paddingTop: insets.top + theme.spacing.md }]}
            >
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Feather name="arrow-left" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                    {/* Dummy Avatar implementation for Chat Header */}
                    <Image
                        source={{ uri: 'https://i.pravatar.cc/150?img=9' }}
                        style={styles.headerAvatar}
                    />
                    <View>
                        <Text style={styles.headerTitle}>{user?.name || 'Chat'}</Text>
                        <Text style={styles.headerSubtitle}>Online</Text>
                    </View>
                </View>

                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.headerIcon}>
                        <Feather name="video" size={22} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.headerIcon}>
                        <Feather name="phone" size={22} color={theme.colors.primary} />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
                enabled={true}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={item => item.id}
                    renderItem={renderMessage}
                    contentContainerStyle={styles.messageList}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />

                {isTyping && (
                    <View style={styles.typingIndicator}>
                        <View style={styles.typingBubble}>
                            <Text style={styles.typingText}>typing...</Text>
                        </View>
                    </View>
                )}

                <View style={[
                    styles.inputContainer,
                    {
                        paddingBottom: Platform.OS === 'ios'
                            ? Math.max(insets.bottom, 15)
                            : insets.bottom + 10
                    }
                ]}>
                    <TouchableOpacity style={styles.attachButton}>
                        <Feather name="plus" size={24} color={theme.colors.primary} />
                    </TouchableOpacity>

                    <View style={styles.textInputWrapper}>
                        <TextInput
                            style={styles.textInput}
                            value={inputText}
                            onChangeText={setInputText}
                            placeholder="Message..."
                            placeholderTextColor={theme.colors.textMuted}
                            multiline
                        />
                        {inputText.trim() === '' && (
                            <TouchableOpacity style={styles.cameraIcon}>
                                <Feather name="camera" size={20} color={theme.colors.textMuted} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {inputText.trim() !== '' && (
                        <TouchableOpacity
                            style={styles.sendButton}
                            onPress={sendMessage}
                        >
                            <Feather name="arrow-up" size={20} color={theme.colors.surface} />
                        </TouchableOpacity>
                    )}
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    safeContainer: {
        flex: 1,
        backgroundColor: theme.colors.surface,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.md,
        paddingBottom: theme.spacing.sm,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        ...theme.shadows.small,
        elevation: 2,
        zIndex: 10,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        paddingRight: theme.spacing.sm,
        paddingLeft: theme.spacing.xs,
    },
    headerAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: theme.spacing.sm,
    },
    headerTitle: {
        fontSize: theme.typography.sizes.title,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.text,
    },
    headerSubtitle: {
        fontSize: theme.typography.sizes.small,
        color: theme.colors.success, // Green online indicator
        fontFamily: theme.typography.fontFamily.medium,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIcon: {
        marginLeft: theme.spacing.md,
        padding: theme.spacing.xs,
    },
    container: {
        flex: 1,
        backgroundColor: '#F7F9FC', // Extremely subtle cool gray for modern chat backgrounds
    },
    messageList: {
        padding: theme.spacing.md,
        paddingBottom: theme.spacing.xl, // Extra padding at bottom
    },
    messageWrapper: {
        flexDirection: 'row',
        marginBottom: theme.spacing.sm,
        width: '100%',
    },
    messageWrapperMe: {
        justifyContent: 'flex-end',
    },
    messageWrapperThem: {
        justifyContent: 'flex-start',
    },
    messageBubble: {
        maxWidth: '75%',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 12, // slightly taller for readability
        borderRadius: 24, // softer, more modern radius (iMessage/WhatsApp style)
        ...theme.shadows.small,
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    messageMe: {
        backgroundColor: theme.colors.primary,
        borderBottomRightRadius: 6,
    },
    messageThem: {
        backgroundColor: theme.colors.surface,
        borderBottomLeftRadius: 6,
        borderWidth: StyleSheet.hairlineWidth, // Subtle definition
        borderColor: 'rgba(0,0,0,0.03)',
    },
    messageMeConsecutive: {
        borderTopRightRadius: 6,
        borderBottomRightRadius: 6,
    },
    messageThemConsecutive: {
        borderTopLeftRadius: 6,
        borderBottomLeftRadius: 6,
    },
    messageText: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.text,
        lineHeight: 22,
    },
    messageTextMe: {
        color: theme.colors.surface,
    },
    messageTime: {
        fontSize: 10,
        color: theme.colors.textMuted,
        marginTop: 2,
        alignSelf: 'flex-end',
        fontFamily: theme.typography.fontFamily.medium,
    },
    messageTimeMe: {
        color: 'rgba(255, 255, 255, 0.7)',
    },
    typingIndicator: {
        paddingHorizontal: theme.spacing.md,
        paddingBottom: theme.spacing.sm,
        flexDirection: 'row',
    },
    typingBubble: {
        backgroundColor: theme.colors.surface,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        borderBottomLeftRadius: 4,
        ...theme.shadows.small,
    },
    typingText: {
        fontSize: theme.typography.sizes.small,
        color: theme.colors.textMuted,
        fontFamily: theme.typography.fontFamily.medium,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: theme.spacing.md,
        paddingTop: theme.spacing.sm,
        backgroundColor: theme.colors.surface,
        // paddingBottom will be handled inline with safe area insets
        borderTopLeftRadius: 24, // Modern bottom sheet curve
        borderTopRightRadius: 24,
        ...theme.shadows.medium,
        shadowOpacity: 0.08,
        elevation: 10,
    },
    attachButton: {
        paddingHorizontal: theme.spacing.sm,
        paddingBottom: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textInputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: theme.colors.background,
        borderRadius: 24,
        marginHorizontal: theme.spacing.xs,
        paddingHorizontal: theme.spacing.md,
        paddingTop: Platform.OS === 'ios' ? 12 : 8,
        paddingBottom: Platform.OS === 'ios' ? 12 : 8,
        maxHeight: 120,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    textInput: {
        flex: 1,
        fontSize: theme.typography.sizes.body,
        color: theme.colors.text,
        maxHeight: 100,
        paddingTop: 0,
        paddingBottom: 0,
    },
    cameraIcon: {
        marginLeft: theme.spacing.sm,
        paddingBottom: 2,
    },
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: theme.spacing.sm,
        marginBottom: 4,
    },
});
