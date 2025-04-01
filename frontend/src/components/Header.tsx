import React from 'react'
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { Button } from './ui/button';


const Header = () => {
  return (
    <header>
    <SignedOut>
      <SignInButton />
    </SignedOut>
    <SignedIn>
      <UserButton />
    </SignedIn>

    <div >
      <Button>Click me</Button>
    </div>
  </header>
  )
}

export default Header