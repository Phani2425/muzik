import React from "react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";

const Header = () => {

  return (
    <header className="fixed top-0 left-0 w-full px-6 py-4 shadow-2xl flex items-center justify-between">
      <div className="font-bold text-2xl cursor-pointer  ">
        <Link to={"/"}>Muzick</Link>
      </div>

      <div className="flex items-center gap-3">
        <SignedOut>
          <Button variant={"outline"} className="font-semibold">
            <SignInButton />
          </Button>
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </header>
  );
};

export default Header;
