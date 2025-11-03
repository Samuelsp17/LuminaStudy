import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  Easing,
  Vibration,
} from 'react-native';
import { Audio } from 'expo-av';

// Tempos padrão
const tempoFocoPadrao = 25 * 60;
const tempoDescansoPadrao = 5 * 60;

export default function TimerScreen() {
  // Estados
  const [tempoFoco, setTempoFoco] = useState(tempoFocoPadrao);
  const [tempoDescanso, setTempoDescanso] = useState(tempoDescansoPadrao);
  const [modoDescanso, setModoDescanso] = useState(false);
  const [tempoRestante, setTempoRestante] = useState(tempoFoco);
  const [estaAtivo, setEstaAtivo] = useState(false);

  // Animação do circulo e da opacidade
  const TimerOpacidade = useRef(new Animated.Value(0.5)).current;
  const animateOpacity = (toValue) => {
    Animated.timing(TimerOpacidade, {
      toValue,
      duration: 200,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  };
  const apagarTexto = () => animateOpacity(0.5);
  const acenderTexto = () => animateOpacity(1);

  const borderWidthAnim = useRef(new Animated.Value(20)).current;
  const animateBorder = (toValue) => {
    Animated.timing(borderWidthAnim, {
      toValue,
      duration: 350,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();
  };

  const engrossarBorda = () => animateBorder(20);
  const afinarBorda = () => animateBorder(5);

  // Configuração do áudio
  useEffect(() => {
    const setAudioMode = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
          staysActiveInBackground: true,
          interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (e) {
        console.error('Falha ao configurar áudio', e);
      }
    };
    setAudioMode();
  }, []);

  async function playSound() {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('./assets/sounds/new-notification-024-370048.mp3')
      );
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) sound.unloadAsync();
      });
      await sound.playAsync();
    } catch (error) {
      console.error('Erro ao tocar som:', error);
    }
  }

  // Lógica do Timer
  useEffect(() => {
    let timer;

    if (estaAtivo && tempoRestante > 0) {
      timer = setInterval(() => {
        setTempoRestante((t) => t - 1);
      }, 1000);
    } else if (tempoRestante === 0) {
      Vibration.vibrate();
      playSound();

      // Alternar modo automaticamente
      if (!modoDescanso) {
        setModoDescanso(true);
        setTempoRestante(tempoDescanso);
      } else {
        setModoDescanso(false);
        setTempoRestante(tempoFoco);
      }
    }

    return () => clearInterval(timer);
  }, [estaAtivo, tempoRestante, modoDescanso, tempoFoco, tempoDescanso]);

  // Controles
  const handleStart = () => {
    setEstaAtivo(true);
    afinarBorda();
    acenderTexto();
  };

  const handlePause = () => {
    setEstaAtivo(false);
    engrossarBorda();
    apagarTexto();
  };

  const handleReset = () => {
    setEstaAtivo(false);
    setTempoRestante(modoDescanso ? tempoDescanso : tempoFoco);
    engrossarBorda();
    apagarTexto();
  };

  const handleToggleMode = () => {
    if (estaAtivo) return;

    if (!modoDescanso) {
      setModoDescanso(true);
      setTempoRestante(tempoDescanso);
    } else {
      setModoDescanso(false);
      setTempoRestante(tempoFoco);
    }
  };

  const aumentarTempo = () => {
    if (estaAtivo) return;

    setTempoRestante((tempoAtual) => {
      const segundosRestantes = tempoAtual % 60;
      let novoTempoTotal;

      if (segundosRestantes === 0) {
        novoTempoTotal = tempoAtual + 60;
      } else {
        const segundosParaArredondar = 60 - segundosRestantes;
        novoTempoTotal = tempoAtual + segundosParaArredondar;
      }

      if (modoDescanso) {
        setTempoDescanso(novoTempoTotal);
      } else {
        setTempoFoco(novoTempoTotal);
      }
      return novoTempoTotal;
    });
  };

  const diminuirTempo = () => {
    if (estaAtivo) return;

    setTempoRestante((tempoAtual) => {
      const segundosExtras = tempoAtual % 60;
      let novoTempoTotal;

      if (segundosExtras === 0) {
        novoTempoTotal = tempoAtual - 60;
      } else {
        novoTempoTotal = tempoAtual - segundosExtras;
      }

      if (novoTempoTotal < 60) {
        novoTempoTotal = 60;
      }

      if (modoDescanso) {
        setTempoDescanso(novoTempoTotal);
      } else {
        setTempoFoco(novoTempoTotal);
      }
      return novoTempoTotal;
    });
  };

  // Formatação
  const minutos = Math.floor(tempoRestante / 60);
  const segundos = tempoRestante % 60;
  const minutosFormatados = String(minutos).padStart(2, '0');
  const segundosFormatados = String(segundos).padStart(2, '0');

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={handleToggleMode}>
        <View style={styles.modoTextoContainer}>
          <Text style={styles.modoTextoT}>
            {modoDescanso ? 'DESCANSO ' : 'FOCO '}
          </Text>

          {/* mostrar setas se timer parado */}
          {!estaAtivo && <Text style={styles.modoTextoSetas}>{'◀ ▶'}</Text>}
        </View>
      </TouchableOpacity>

      <Animated.View
        style={[styles.timerContainer, { borderWidth: borderWidthAnim }]}>
        <Animated.Text style={[styles.timerText, { opacity: TimerOpacidade }]}>
          {minutosFormatados}:{segundosFormatados}
        </Animated.Text>
      </Animated.View>

      {/* Botões de ajuste */}
      <View style={styles.ajusteContainer}>
        <TouchableOpacity onPress={diminuirTempo} style={[styles.botaoTamanho]}>
          <Text style={styles.botaoAjusteTexto}>−1</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={aumentarTempo} style={[styles.botaoTamanho]}>
          <Text style={styles.botaoAjusteTexto}>+1</Text>
        </TouchableOpacity>
      </View>

      {/* Botões de controle */}
      <View style={styles.botoesContainer}>
        {!estaAtivo ? (
          <TouchableOpacity
            onPress={handleStart}
            style={[styles.botao, styles.botaoIniciar]}>
            <Text style={styles.botaoTexto}>Iniciar</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handlePause}
            style={[styles.botao, styles.botaoPausar]}>
            <Text style={styles.botaoTexto}>Pausar</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={handleReset}
          style={[styles.botao, styles.botaoResetar]}>
          <Text style={styles.botaoTexto}>Resetar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#161012',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modoTextoContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  botaoTamanho: {
    borderRadius: 30,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3e3837',
    borderWidth: 2,
    borderColor: '#bcb8b680',
    opacity: 0.9,
  },
  modoTextoT: {
    fontSize: 19,
    position: 'relative',
    top: 3,
    color: '#645b59',
    fontWeight: '500',
  },
  modoTextoSetas: {
    fontSize: 12,
    color: '#645b59',
    fontWeight: '500',
  },
  timerContainer: {
    borderColor: '#3e3837',
    borderRadius: 150,
    width: 300,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  timerText: {
    fontSize: 52,
    fontWeight: 'bold',
    color: '#bcb8b6',
  },
  botoesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '60%',
    marginBottom: 25,
  },
  botao: {
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    minWidth: 100,
    opacity: 0.85,
    borderWidth: 1,
    borderColor: '#bcb8b645',
    marginTop: 15,
  },
  botaoTexto: {
    color: '#161012',
    fontSize: 16,
    fontWeight: 'bold',
  },
  botaoAjusteTexto: {
    fontSize: 16,
    color: '#bcb8b6',
    fontWeight: 'bold',
  },
  botaoIniciar: {
    backgroundColor: '#eb5b1c',
  },
  botaoPausar: {
    backgroundColor: '#f7d2a0',
  },
  botaoResetar: {
    backgroundColor: '#36d4b3',
  },
  ajusteContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginTop: -50,
  },
});
