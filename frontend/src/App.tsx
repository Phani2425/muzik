import { Routes,Route } from "react-router-dom"
import Home from "./pages/Home"
import Room from "./pages/Room"
import { useSocket } from "./hooks/useSocket"

function App() {

  const socket= useSocket(); 

  return (
   <Routes>
    <Route path="/" element={<Home socket={socket} />} />
    <Route path="/room/:roomid" element={<Room socket={socket} />} />
   </Routes>
  )
}

export default App
