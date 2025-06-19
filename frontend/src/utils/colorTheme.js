import { ColorTheme } from 'molstar/lib/mol-theme/color';
import { ParamDefinition as PD } from 'molstar/lib/mol-util/param-definition';

// Dummy params for compatibility
const PLDDTParams = { };

export function registerPLDDTTheme(plddtArray) {
    console.log('Registering JSON pLDDT theme with data:', plddtArray);
   let arr = Array.isArray(plddtArray) ? plddtArray : Object.values(plddtArray).map(Number);

  const PLDDTThemeProvider = {
    name: 'json-plddt',
    label: 'JSON pLDDT',
    category: 'Custom',
    factory: () => ({
      granularity: 'group',
      color: (location) => {
        if (location.kind === 'element-location') {
          const globalIndex = location.unit.elements[location.element];
          const score = arr[globalIndex];
          if (score === undefined) return 0xCCCCCC;
          if (score >= 90) return 0x2166AC;
          if (score >= 70) return 0x67A9CF;
          if (score >= 50) return 0xEF8A62;
          return 0xB2182B;
        }
        return 0xCCCCCC;
      },
      props: {},
      description: 'pLDDT from confidences.json',
      legend: [
        [0, 0xB2182B],
        [50, 0xEF8A62],
        [70, 0x67A9CF],
        [90, 0x2166AC]
      ]
    }),
    getParams: () => ({}),
    defaultValues: {},
    isApplicable: () => true
  };

  ColorTheme.BuiltIn['json-plddt'] = PLDDTThemeProvider;
  return PLDDTThemeProvider;
}
