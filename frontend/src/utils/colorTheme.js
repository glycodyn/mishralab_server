import { ColorTheme } from 'molstar/lib/mol-theme/color';
import { ParamDefinition as PD } from 'molstar/lib/mol-util/param-definition';

// Dummy params for compatibility
const PLDDTParams = { };

export function registerPLDDTTheme(plddtArray) {
  const PLDDTThemeProvider = {
    name: 'json-plddt',
    label: 'JSON pLDDT',
    category: 'Custom',
    factory: (ctx, props) => {
      // Always convert to array in case it's an object with numeric keys
      let arr = plddtArray;
      if (!Array.isArray(arr)) {
        arr = Object.values(arr).map(Number);
      }
      return {
        granularity: 'group',
        color: (location) => {
          if (location.kind === 'element-location') {
            const globalIndex = location.unit.elements[location.element];
            const score = arr[globalIndex];
            // Uncomment for debugging:
            // console.log(`globalIndex: ${globalIndex}, score: ${score}`);
            if (score === undefined) return 0xCCCCCC;
            if (score >= 90) return 0x2166AC;
            if (score >= 70) return 0x67A9CF;
            if (score >= 50) return 0xEF8A62;
            return 0xB2182B;
          }
          return 0xCCCCCC;
        },
        props,
        description: 'pLDDT from confidences.json',
        legend: [
          [0, 0xB2182B],
          [50, 0xEF8A62],
          [70, 0x67A9CF],
          [90, 0x2166AC]
        ]
      };
    },
    getParams: () => PLDDTParams,
    defaultValues: PD.getDefaultValues(PLDDTParams),
    isApplicable: () => true
  };

  ColorTheme.BuiltIn['json-plddt'] = PLDDTThemeProvider;
}