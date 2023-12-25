import { ActivityIndicator, Text, StyleSheet } from 'react-native'
import { BlurView } from 'expo-blur';
import useTheme from '../utils/theme';

const LoadingPage = ({active}: {active:boolean}) => {
  const { colors } = useTheme();

   if(active){
    return (<BlurView intensity={4} style={[styles.container, StyleSheet.absoluteFill]} >
      <Text style={[styles.text,{color:colors.text}]}>Loading ...</Text>
      <ActivityIndicator size={52} />
    </BlurView >)
  }else{
     return <></>

   }
}

export default LoadingPage;

const styles = StyleSheet.create({
  container: {
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 28,
    marginBottom: 10,
  }
})