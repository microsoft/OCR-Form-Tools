import {createTheme} from 'office-ui-fabric-react';

const greenButtonPalette = {
  "themePrimary": "#81ab2c",
  "themeLighterAlt": "#050702",
  "themeLighter": "#151b07",
  "themeLight": "#27330d",
  "themeTertiary": "#4d671b",
  "themeSecondary": "#719627",
  "themeDarkAlt": "#8bb33c",
  "themeDark": "#9bbf54",
  "themeDarker": "#b3d07a",
  "neutralLighterAlt": "#31353c",
  "neutralLighter": "#31353b",
  "neutralLight": "#2f3238",
  "neutralQuaternaryAlt": "#2b2f34",
  "neutralQuaternary": "#292d32",
  "neutralTertiaryAlt": "#282b30",
  "neutralTertiary": "#f6f6f6",
  "neutralSecondary": "#f8f8f8",
  "neutralPrimaryAlt": "#f9f9f9",
  "neutralPrimary": "#f1f1f1",
  "neutralDark": "#fcfcfc",
  "black": "#fdfdfd",
  "white": "#32363C"
};

const whiteButtonPalette = {
  "themePrimary": "white",
  "themeLighterAlt": "#767676",
  "themeLighter": "#a6a6a6",
  "themeLight": "#c8c8c8",
  "themeTertiary": "#d0d0d0",
  "themeSecondary": "#dadada",
  "themeDarkAlt": "#eaeaea",
  "themeDark": "#f4f4f4",
  "themeDarker": "#f8f8f8",
  "neutralLighterAlt": "#31353c",
  "neutralLighter": "#31353b",
  "neutralLight": "#2f3238",
  "neutralQuaternaryAlt": "#2b2f34",
  "neutralQuaternary": "#292d32",
  "neutralTertiaryAlt": "#282b30",
  "neutralTertiary": "#f6f6f6",
  "neutralSecondary": "#f8f8f8",
  "neutralPrimaryAlt": "#f9f9f9",
  "neutralPrimary": "#f1f1f1",
  "neutralDark": "#fcfcfc",
  "black": "#fdfdfd",
  "white": "#32363C"
}

const redButtonPalette = {
    "themePrimary": "#f2635e",
    "themeLighterAlt": "#0a0404",
    "themeLighter": "#27100f",
    "themeLight": "#491e1c",
    "themeTertiary": "#913c39",
    "themeSecondary": "#d55753",
    "themeDarkAlt": "#f4726e",
    "themeDark": "#f58784",
    "themeDarker": "#f8a6a3",
    "neutralLighterAlt": "#262a2f",
    "neutralLighter": "#262a2e",
    "neutralLight": "#24282c",
    "neutralQuaternaryAlt": "#222529",
    "neutralQuaternary": "#202328",
    "neutralTertiaryAlt": "#1f2226",
    "neutralTertiary": "#f0f2f5",
    "neutralSecondary": "#f2f4f6",
    "neutralPrimaryAlt": "#f5f6f8",
    "neutralPrimary": "#e9ecef ",
    "neutralDark": "#fafbfb",
    "black": "#fcfdfd",
    "white": "#272B30",
}

export function getPrimaryWhiteTheme() {
  return createTheme({palette: whiteButtonPalette});

};

export function getPrimaryRedTheme() {
  return createTheme({palette: redButtonPalette});

};

export function getPrimaryGreenTheme() {
  return createTheme({palette: greenButtonPalette});

};