import React from 'react';
import './PublicHome.css';

import PublicNavbar from '../../components/public/PublicNavbar';
import HeroSlider from '../../components/public/HeroSlider';
import AboutAarohan from '../../components/public/AboutAarohan';
import ProgramSection from '../../components/public/ProgramSection';
import HowItWorks from '../../components/public/HowItWorks';
import NHAASection from '../../components/public/NHAASection';
import GovernmentSupport from '../../components/public/GovernmentSupport';
import SupportJourney from '../../components/public/SupportJourney';
import PrivacySection from '../../components/public/PrivacySection';
import HumanAISupport from '../../components/public/HumanAISupport';
import AccessSection from '../../components/public/AccessSection';
import HelplineSection from '../../components/public/HelplineSection';
import PublicFooter from '../../components/public/PublicFooter';

export default function PublicHome() {
  return (
    <div className="public-home">
      <PublicNavbar />
      <HeroSlider />
      <div id="about"><AboutAarohan /></div>
      <div id="program"><ProgramSection /></div>
      <div id="howitworks"><HowItWorks /></div>
      <NHAASection />
      <div id="ecosystem"><GovernmentSupport /></div>
      <SupportJourney />
      <HumanAISupport />
      <div id="privacy"><PrivacySection /></div>
      <AccessSection />
      <div id="helpline"><HelplineSection /></div>
      <PublicFooter />
    </div>
  );
}
