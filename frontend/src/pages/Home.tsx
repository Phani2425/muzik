import Header from "@/components/Header";
import JoinRoom from "@/components/JoinRoom";
import { Socket } from "socket.io-client";

interface HomeProp {
    socket:Socket | null
}

const Home:React.FC<HomeProp> = ({socket}) => {

  return (
    <div>
      <Header />
      <JoinRoom socket={socket} />
    </div>
  );
};

export default Home;
