// custom type declarations for assets

// Allows importing SVGs as modules, matching Create React App behavior
// https://create-react-app.dev/docs/adding-images-fonts-and-files/#adding-svgs

declare module '*.svg' {
  const content: string;
  export default content;
}
