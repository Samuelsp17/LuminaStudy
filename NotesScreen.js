import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
  Alert,
  SafeAreaView,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// CRUD básico de anotações com layout simples

export default function NotasApp() {
  const STORAGE_KEY = '@minhas_notas_v1';

  const [notes, setNotes] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadNotes();
  }, []);

  useEffect(() => {
    saveNotes(notes);
  }, [notes]);

  async function loadNotes() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setNotes(JSON.parse(raw));
    } catch (err) {
      console.error('Erro ao carregar notas', err);
    }
  }

  async function saveNotes(list) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (err) {
      console.error('Erro ao salvar notas', err);
    }
  }

  function openCreate() {
    setEditingId(null);
    setTitle('');
    setContent('');
    setModalVisible(true);
  }

  function openEdit(note) {
    setEditingId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setModalVisible(true);
  }

  function handleSave() {
    if (!title.trim()) {
      Alert.alert('Validação', 'O título é obrigatório.');
      return;
    }

    if (editingId) {
      const updated = notes.map(n => (n.id === editingId ? { ...n, title, content, updatedAt: Date.now() } : n));
      setNotes(updated);
    } else {
      const newNote = {
        id: String(Date.now()),
        title: title.trim(),
        content: content.trim(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setNotes(prev => [newNote, ...prev]);
    }

    setModalVisible(false);
  }

  function handleDelete(id) {
    Alert.alert('Excluir nota', 'Tem certeza que deseja excluir esta nota?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => setNotes(prev => prev.filter(n => n.id !== id)),
      },
    ]);
  }

  function renderItem({ item }) {
    return (
      <View style={styles.card}>
        <Pressable
          style={{ flex: 1 }}
          android_ripple={{ color: '#eee' }}
          onPress={() => openEdit(item)}
        >
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text numberOfLines={3} style={styles.cardContent}>
            {item.content || '— sem conteúdo —'}
          </Text>
        </Pressable>

        <View style={styles.cardActions}>
          <TouchableOpacity onPress={() => openEdit(item)} style={styles.actionButton}>
            <Text style={styles.actionText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionButton}>
            <Text style={[styles.actionText, { color: '#e55039' }]}>Excluir</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Minhas Anotações</Text>
        <TouchableOpacity onPress={openCreate} style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Nova</Text>
        </TouchableOpacity>
      </View>

      {notes.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Você ainda não tem anotações. Toque em "+ Nova" para criar uma.</Text>
        </View>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 12 }}
        />
      )}

      <Modal animationType="slide" visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingId ? 'Editar Nota' : 'Nova Nota'}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.closeText}>Fechar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Título</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Título da nota"
              style={styles.input}
              returnKeyType="next"
            />

            <Text style={[styles.label, { marginTop: 12 }]}>Conteúdo</Text>
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="Escreva sua anotação aqui..."
              style={[styles.input, { height: 140, textAlignVertical: 'top' }]}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.modalButton, { backgroundColor: '#ddd' }]}> 
                <Text>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleSave} style={styles.modalButton}>
                <Text style={{ color: 'white' }}>{editingId ? 'Salvar' : 'Criar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f8',
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  addButton: {
    backgroundColor: '#222f3e',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardContent: {
    color: '#444',
    marginBottom: 8,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  actionText: {
    color: '#2e86de',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeText: {
    color: '#2e86de',
    fontWeight: '600',
  },
  form: {
    padding: 16,
  },
  label: {
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fafafa',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginHorizontal: 6,
    backgroundColor: '#222f3e',
  },
});
