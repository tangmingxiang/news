import express from 'express'
import { getAllUser } from '../controller/user_ctrl.js'

const router = express.Router()
router.get('/user', getAllUser)

export default router
