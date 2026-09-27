export const ADU_CATALOG = [
  {
    id: "studio-400",
    name: "Cabin Studio",
    beds: 0,
    baths: 1,
    widthFt: 20,
    depthFt: 20,
    photo: "/images/parkmodel.png",
    plan: "/plans/studio-400.svg",
    features: ["Open living and sleeping area", "Full kitchen wall", "Walk-in shower"],
  },
  {
    id: "one-bed-600",
    name: "Garden One",
    beds: 1,
    baths: 1,
    widthFt: 30,
    depthFt: 20,
    photo: "/adu-imgs/photogallery.png",
    plan: "/plans/one-bed-600.svg",
    features: ["Private bedroom", "Open kitchen and living", "Full bathroom"],
  },
  {
    id: "two-bed-800",
    name: "Coastal Two",
    beds: 2,
    baths: 1,
    widthFt: 40,
    depthFt: 20,
    photo: "/images/forsale.png",
    plan: "/plans/two-bed-800.svg",
    features: ["Two bedrooms on opposite ends", "Central living and kitchen", "Full bathroom"],
  },
  {
    id: "two-bed-1000",
    name: "Meadow Ranch",
    beds: 2,
    baths: 2,
    widthFt: 50,
    depthFt: 20,
    photo: "/images/adu_apartment.png",
    plan: "/plans/two-bed-1000.svg",
    features: ["Two bedroom suites", "Two full bathrooms", "Long kitchen island"],
  },
];

export const getAduArea = (adu) => adu.widthFt * adu.depthFt;

export const getAduById = (id) => ADU_CATALOG.find((adu) => adu.id === id) ?? null;

export const formatBedsBaths = ({ beds, baths }) =>
  `${beds === 0 ? "Studio" : `${beds} bed`} · ${baths} bath`;
