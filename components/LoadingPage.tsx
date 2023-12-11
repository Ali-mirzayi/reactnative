import { ActivityIndicator, Text, StyleSheet, View } from 'react-native'
import { BlurView } from 'expo-blur';

const LoadingPage = ({active}: {active:boolean}) => {
   if(active){
    return (<BlurView intensity={4} style={[styles.container, StyleSheet.absoluteFill]} >
      <Text style={styles.text}>Loading ...</Text>
      <ActivityIndicator size={52} />
    </BlurView >)
  }else{
     return <></>

   }

    // <BlurView intensity={4} style={[styles.container, StyleSheet.absoluteFill]} >
    //   <Text style={styles.text}>Loading ...</Text>
    //   <ActivityIndicator size={52} />
    // </BlurView >
    // :
    // return <View />

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