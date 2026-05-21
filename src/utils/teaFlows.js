export const TEA_STAGE_GUIDES = [
  {
    teaType: "Green Tea",
    stages: ["Plucking", "Withering", "Rolling", "Drying", "Packing"],
  },
  {
    teaType: "Yellow Tea",
    stages: ["Plucking", "Withering", "Rolling", "Pre-Drying", "Drying", "Post-Drying", "Packing"],
  },
  {
    teaType: "White Tea",
    stages: ["Plucking", "Withering", "Drying", "Packing"],
  },
  {
    teaType: "Oolong Tea",
    stages: ["Plucking", "Withering", "Rolling", "Pre-Drying", "Drying", "Post-Drying", "Packing"],
  },
  {
    teaType: "Black Tea",
    stages: ["Plucking", "Withering", "Rolling", "Pre-Drying", "Drying", "Post-Drying", "Packing"],
  },
  {
    teaType: "Dark Tea",
    stages: ["Plucking", "Withering", "Rolling", "Pre-Drying", "Drying", "Post-Drying", "Packing"],
  },
];

export const TEA_TYPE_OPTIONS = TEA_STAGE_GUIDES.map((guide) => guide.teaType);

export function getTeaStageGuide(teaType) {
  return TEA_STAGE_GUIDES.find((guide) => guide.teaType === teaType) || TEA_STAGE_GUIDES[0];
}
