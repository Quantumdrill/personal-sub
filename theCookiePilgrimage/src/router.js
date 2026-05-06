import { createWebHistory, createRouter } from 'vue-router'
import startPage from "./components/stages/startPage.vue"
import stage1 from "./components/stages/stage1.vue"
import stage21 from "./components/stages/stage21.vue"
import stage22 from "./components/stages/stage22.vue"
import stage24 from "./components/stages/stage24.vue"
import stage31 from "./components/stages/stage31.vue"
import stage32 from "./components/stages/stage32.vue"
import stage33 from "./components/stages/stage33.vue"
import stage4 from "./components/stages/stage4.vue"
import stage51 from "./components/stages/stage51.vue"
import stage52 from "./components/stages/stage52.vue"
import stage7 from "./components/stages/stage7.vue"
import endPage from "./components/stages/endPage.vue"
import popups from "./components/global/popups.vue"
import popupsSubmarine from "./components/global/popupsSubmarine.vue"

const routes = [
  { path: "/", component: startPage },
  { path: "/webArtifacts", component: stage1 },
  { path: "/popupBridges", component: stage21 },
  { path: "/stretchedPopupBridges", component: stage22 },
  { path: "/darkMode", component: stage24 },
  { path: "/morePopups", component: stage31 },
  { path: "/submarine", component: stage32 },
  { path: "/waypoint", component: stage33 },
  { path: "/abyss", component: stage4 },
  { path: "/shield", component: stage51 },
  { path: "/airHockey", component: stage52 },
  { path: "/artifactChamber", component: stage7 },
  { path: "/thankYou", component: endPage },
  { path: "/popups/:id", component: popups },
  { path: "/popupsSubmarine/:id", component: popupsSubmarine },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})