<script setup>

import {ref, onMounted, watch} from "vue"
import {useRoute} from "vue-router"

let buttonDispState = ref(false)
let textDispState = ref(true)
let lockedState = ref(false)
let textDisp = ref("Drag me")
let buttonText = ref("Snap in place")
const route = useRoute()
const chan = new BroadcastChannel("global")
let hockeyButtonDispState = ref(false)


onMounted(()=>{
    chan.postMessage({type:"handshake", id:Number(route.params.id)})
})
chan.onmessage=(e)=>{
    if (e.data.type === "snapButtonShow" && e.data.id === Number(route.params.id)){ //the param is a string
        buttonDispState.value = e.data.action
        if (!lockedState.value){
            textDispState.value = !e.data.action
        }
    }
    if (e.data.type === "typeInitialize" && e.data.id === Number(route.params.id)){
        if (e.data.popupType===1){
            textDisp.value = "Drag me"
        } else if (e.data.popupType===2){
            textDisp.value = "Wait"
        } else if (e.data.popupType===4){
            textDisp.value = "Drag me and win the air hockey game!"
        } else if (e.data.popupType===5){
            textDisp.value = "Hit me"
        } else if (e.data.popupType===6){
            textDispState.value = false
            hockeyButtonDispState.value = true
        }
    }
}

function snapInPlace(){
    chan.postMessage({type: "snapButtonAction", id:Number(route.params.id)})
    lockedState.value = true
    textDispState.value = false
}

function goToArtifactChamber(){
    chan.postMessage({type: "goToArtifactChamber", id:Number(route.params.id)})
}
</script>
<template>
    <div id="body">
        <p v-if="textDispState" id="textDisp">{{textDisp}}</p> 
        <button v-if="buttonDispState&&!lockedState" @click="snapInPlace()">{{buttonText}}</button> 
        <button v-if="hockeyButtonDispState" @click="goToArtifactChamber()">Go to /ArtifactChamber</button> 
    </div>
</template>
<style scoped>
    #body{
        position: fixed;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    #textDisp{
        text-align: center;
    }
</style>
