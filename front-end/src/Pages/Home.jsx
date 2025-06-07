import { React } from "react";
import NavBar from "../Components/NavBar/NavBar";
import HomeSec from "../Components/HomeSec/HomeSec";
import AboutSec from "../Components/AboutSec/AboutSec";
import ServicesSec from "../Components/ServicesSec/ServicesSec";
import MenuSec from "../Components/MenuSec/MenuSec";
import ContactSec from "../Components/ContactSec/ContactSec";

const Home = () => {
  return (
    <>
      <header
        className='header'
        style={{ position: "fixed", width: "100vw", zIndex: "1000" }}
      >
        <NavBar />
      </header>
      <section id='Home'>
        <HomeSec />
      </section>
      <section id='About'>
        <AboutSec />
      </section>
      <section id='Services'>
        <ServicesSec />
      </section>
      <section id='Menu'>
        <MenuSec />
      </section>
      <section id='Contact'>
        <ContactSec />
      </section>
    </>
  );
};

export default Home;
