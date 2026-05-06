<script setup>

import {ref, onMounted, watch} from "vue"
import {useRoute} from "vue-router"
import Naoto from "../character/Naoto.vue"

let buttonDispState = ref(false)
let textDispState = ref(true)
let lockedState = ref(false)
let textDisp = ref("")
let animSequence = ref(null)
const route = useRoute()
const chan = new BroadcastChannel("global")
let naotoPos = ref(1)
let nextButtonDispState = ref(false)

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
    if (e.data.type === "stage32PopupComm" && e.data.id === Number(route.params.id)){ //the param is a string
        if (e.data.action === "init"){
            animSequence.value = "stage32SubmarineInit"
        }
        if (e.data.action === 3){
            nextButtonDispState.value = true
        }
    }
    if (e.data.type === "stage33PopupComm" && e.data.id === Number(route.params.id)){
        if (e.data.action === "stabbed"){
            animSequence.value = "stage33StabbedInSubmarine"
        }
    }
    if (e.data.type === "typeInitialize" && e.data.id === Number(route.params.id)){
        if (e.data.popupType===1){
            textDisp.value = "Drag me"
        } else if (e.data.popupType===2){
            textDisp.value = "Wait"
        } else if (e.data.popupType===3){
            textDisp.value = ""
        }
    }
}

function snapInPlace(){
    chan.postMessage({type: "snapButtonAction", id:Number(route.params.id)})
    lockedState.value = true
    textDispState.value = false
}

function naotoPosUpdate(pos){
    naotoPos.value = pos
}

function nextButtonAction(){
    chan.postMessage({type:"stage32PopupComm",id:Number(route.params.id),action:"next"})
}

watch(naotoPos, (e)=>{ // triggered when naoto landed in submarine
    if (naotoPos.value === 2){
        textDispState.value = true
        lockedState.value = false
        chan.postMessage({type:"stage32PopupComm",id:Number(route.params.id),action:naotoPos.value})
    }
})

</script>
<template>
    <div id="buttonContainer">
        <p v-if="textDispState">{{textDisp}}</p> 
        <button v-if="buttonDispState&&!lockedState" @click="snapInPlace()">Snap in place</button> 
    </div>
    <Naoto id="naoto" :parentComponent="'popupsSubmarine'" :animSequenceProp="animSequence" @nextButtonActivated="nextButton.disabled = false" @naotoPosUpdate="naotoPosUpdate"/>
    <button id="nextButton" v-if="nextButtonDispState" @click="nextButtonAction" ref="nextButton">next</button>
</template>
<style scoped>
    #buttonContainer{
        position: fixed;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    #naoto{
        position: fixed;
        z-index: -2;
    }

    #nextButton{
        position: fixed;
        right: 8vw;
        bottom: 40vh;
    }
</style>
