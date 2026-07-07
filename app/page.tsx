import BundleLayout from "./bundleLayout";

async function fetchBundleConfig() {
  const apiBase = "http://localhost:3000";
  const res = await fetch(`${apiBase}/api/bundle`, {
    next: { revalidate: 3600 }
  });

  if (!res.ok) {
    throw new Error("Failed to load bundle configurations");
  }
  return res.json();
}

export default async function Home() {
  const initialConfigData = await fetchBundleConfig();

  return <BundleLayout initialData={initialConfigData} />;
}
