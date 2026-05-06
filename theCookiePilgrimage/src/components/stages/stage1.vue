<script setup>
import {useRouter} from "vue-router"
import { ref, onMounted } from "vue"
import Naoto from "../character/Naoto.vue"
const router = useRouter()

let initialized = false
const animSequence = ref(null)

window.onload = () => {
    window.scrollTo(0,0)
}

window.addEventListener("scroll", (e) => {
    if (window.scrollY > 40*window.innerWidth/100+window.innerHeight && !initialized){
        console.log("scroll")
        animSequence.value = "stage1"
        initialized = true
    }
})
</script>
<template>
    <div id="page">
        <div id="h1Container">
            <h1>The web artifacts</h1>
        </div>
        <div class="block">
            <h2>The Broken Hyperlink</h2>
            <div class="blockContent">
                <div class="blockImageContainer"><img class="blockImage" src="../../assets/imgs/brokenHyperlink.png" ></div>
                <div class="blockText">
                    <p>A severed navigational artifact, formerly used to connect one location in the web space to another. Its destination is no longer preserved, leaving only the gesture of travel without the certainty of arrival.

Despite its damaged state, the object retains a faint directional pull. Scholars disagree whether it points toward a lost page, an erased path, or merely the memory of connection itself. Early records suggest that objects of this kind were once common, scattered through archives, forgotten menus, and abandoned indexes.

The Broken Hyperlink is valued less for where it leads than for what it reveals: that every connection may decay, and every route may outlive its destination. Its blue surface, still underlined, continues to invite contact even after its purpose has disappeared.<br><br> Like its name says, it's broken.</p>
                </div>
            </div>
        </div>
        <div class="block">
            <h2>The Hidden Scroll</h2>
            <div class="blockContent">
                <div class="blockText">
                    <p>A concealed vertical relic associated with unseen depth and buried content. The Hidden Scroll suggests that the visible page was never the whole page, only its first surface.

It is commonly found in accounts of lower-page regions, abandoned footers, collapsed sections, and text that remained unread beneath the fold. Its form varies: in some depictions it appears as a narrow bar at the edge of vision; in others, as a rolled strip of interface material marked by downward motion.

The artifact is usually interpreted as a sign of withheld space. It implies that knowledge may exist beyond the frame, not hidden by secrecy, but by distance, impatience, or neglect. To encounter the Hidden Scroll is to be reminded that the page continues even after attention has stopped.
                    <br><br>Like its name says, it's hidden so no one knows where it is.</p>
                </div>
                <div class="blockImageContainer"><img class="blockImage" src="../../assets/imgs/scroll.png" ></div>
            </div>
        </div>
        <div class="block">
            <h2>The Holy Cookie</h2>
            <div class="blockContent">
                <div class="blockImageContainer"><img class="blockImage" src="../../assets/imgs/holyCookie.png" ></div>
                <div class="blockText">
                    <p>A small ceremonial object associated with permission, recognition, and return. Though its material appears ordinary, the Holy Cookie is traditionally understood as a compact between visitor and site: once accepted, the presence of the guest may be remembered, recorded, and welcomed again.

Its origin remains uncertain. Some accounts describe it as a fragment of an early session, preserved after the closing of a page. Others treat it as a devotional offering left at the threshold of the web space, given only to those willing to acknowledge the terms of entry.

The object is often displayed near entrances, banners, and lower margins, where visitors are asked to accept or refuse it. In later interpretations, the Holy Cookie came to symbolize the strange hospitality of the web: generous, intimate, and quietly transactional.</p>
                    <button id="button3" @click="router.push('/popupBridges')">Seek The Cookie Now!</button>
                </div>
            </div>
        </div>
        <div class="block">
            <h2>The Captcha</h2>
            <div class="blockContent">
                <div class="blockText">
                    <p>A verification object composed of fragmented images, checkboxes, and uncertain instructions. The Captcha is believed to have served as a threshold device, separating recognized beings from unrecognized ones.

Its questions are simple in form but unstable in meaning. Surviving examples ask the viewer to identify roads, lights, animals, vehicles, or other signs of ordinary life, though the reason for these trials remains unclear. The object appears repeatedly at gates, forms, protected passages, and other points of controlled entry.

Unlike locks, which require possession of a key, the Captcha requires performance. It asks the visitor to demonstrate perception, obedience, and a certain familiarity with the visible world. For this reason, it has often been read as one of the web space’s most peculiar rituals: a test of humanity conducted through machines.
                    <br><br>The Captcha is 20 thousand levels so no one ever solved it.</p>
                </div>
                <div class="blockImageContainer"><img class="blockImage" src="../../assets/imgs/captcha.png" ></div>
            </div>
        </div>
        <Naoto id="naoto" :parentComponent="'stage1'" 
        :animSequenceProp="animSequence" 
        :naotoLocalVarsProp="naotoLocalVars" 
        @nextButtonActivated="nextButton.disabled = false" 
        @operationButtonOperation="(e)=>appearanceButton.disabled = !e" 
        />
    </div>
</template>
<style scoped>
#page {
    display: flex;
    position: relative;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    overflow: hidden;
}

#h1Container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
}

h1 {
    font-size: 4vw;
}

h2 {
    text-align: center;
    padding: 3vw 0;
}

.block {
    width: 70vw;
    padding: 6vw 0;
}

.blockContent {
    height: 20vw;
    display: flex;
    overflow: hidden;
}

.blockText {
    display: flex;
    flex-direction: column;
    width: 34vw;
    margin-right: 1vw;
    position: relative;
}


.blockImageContainer {
    width: 34vw;
    margin-right: 1vw;
    display: flex;
    justify-content: center;
    align-items: center;
}

.blockImage{
    width: 100%;
    height: 100%;
    object-fit: cover;
}

#button3 {
    width: 10vw;
    align-self: flex-end;
    position: absolute;
    bottom: 0;
    right: 0;
    z-index: 2;
}
#naoto{
    position: absolute;
    top: calc(100vh + 86vw);
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 1;
}

button{
    padding: 0;
}
</style>