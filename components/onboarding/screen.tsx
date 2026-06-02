"use client";

import { useState, useEffect, type CSSProperties, type Dispatch, type SetStateAction } from "react";
import { ease } from "./utils";
import type { FlowType, StepName } from "./types";
import { Splash } from "./steps/splash";
import { InstallApp } from "./steps/install-app";
import { Welcome } from "./steps/welcome";
import { HowItWorks } from "./steps/how-it-works";
import { CreateOrJoin } from "./steps/create-or-join";
import { SetupName } from "./steps/setup-name";
import { PermNotifications } from "./steps/permissions-notifications";
import { PermCamera } from "./steps/permissions-camera";
import { PermGallery } from "./steps/permissions-gallery";
import { AllSet } from "./steps/all-set";

export type ScreenProps = {
  stepKey: StepName;
  step: number;
  direction: number;
  go: (n: number) => void;
  goTo: (name: StepName) => void;
  flowType: FlowType;
  setFlowType: Dispatch<SetStateAction<FlowType>>;
  name: string;
  setName: Dispatch<SetStateAction<string>>;
  groupCode: string;
  setGroupCode: Dispatch<SetStateAction<string>>;
  notifGranted: boolean;
  setNotifGranted: Dispatch<SetStateAction<boolean>>;
  cameraGranted: boolean;
  setCameraGranted: Dispatch<SetStateAction<boolean>>;
  galleryGranted: boolean;
  setGalleryGranted: Dispatch<SetStateAction<boolean>>;
  isStandalone: boolean;
  onEnterApp?: () => void;
};

export function Screen({
  stepKey,
  step,
  direction,
  go,
  goTo,
  flowType,
  setFlowType,
  name,
  setName,
  groupCode,
  setGroupCode,
  notifGranted,
  setNotifGranted,
  cameraGranted,
  setCameraGranted,
  galleryGranted,
  setGalleryGranted,
  isStandalone,
  onEnterApp,
}: ScreenProps) {
  const [entering, setEntering] = useState(true);

  useEffect(() => {
    setEntering(true);
    const t = setTimeout(() => setEntering(false), 30);
    return () => clearTimeout(t);
  }, [step]);

  const containerStyle: CSSProperties = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    transition: `opacity 0.45s ${ease.smooth}, transform 0.45s ${ease.spring}`,
    opacity: entering ? 0 : 1,
    transform: entering ? `translateX(${direction * 30}px)` : "translateX(0)",
  };

  return (
    <div style={containerStyle}>
      {stepKey === "splash" && <Splash go={go} />}
      {stepKey === "install_app" && <InstallApp go={go} isStandalone={isStandalone} />}
      {stepKey === "welcome" && (
        <Welcome go={go} goTo={goTo} setFlowType={setFlowType} />
      )}
      {stepKey === "how_it_works" && <HowItWorks go={go} />}
      {stepKey === "create_or_join" && <CreateOrJoin go={go} flowType={flowType} />}
      {stepKey === "setup_name" && (
        <SetupName
          go={go}
          name={name}
          setName={setName}
          groupCode={groupCode}
          setGroupCode={setGroupCode}
          flowType={flowType}
        />
      )}
      {stepKey === "permissions_notifications" && (
        <PermNotifications
          go={go}
          notifGranted={notifGranted}
          setNotifGranted={setNotifGranted}
          name={name}
        />
      )}
      {stepKey === "permissions_camera" && (
        <PermCamera go={go} cameraGranted={cameraGranted} setCameraGranted={setCameraGranted} />
      )}
      {stepKey === "permissions_gallery" && (
        <PermGallery
          go={go}
          galleryGranted={galleryGranted}
          setGalleryGranted={setGalleryGranted}
        />
      )}
      {stepKey === "all_set" && <AllSet name={name} onEnterApp={onEnterApp} />}
    </div>
  );
}