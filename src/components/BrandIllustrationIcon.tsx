type Props = { group: 'trust' | 'categories'; index: number }

// Display windows within the original illustration sheets; raster files are unchanged.
// Normalise visible artwork (not just SVG boxes) to the category illustrations.
const trustWindows = ['9 36 663 663', '655 93 580 580', '75 687 550 550', '637 670 610 610']
const categoryWindows = ['10 40 500 450', '530 60 480 430', '1030 60 500 430', '10 530 500 450', '530 520 480 450', '1030 520 500 460']

export default function BrandIllustrationIcon({ group, index }: Props) {
  const trust = group === 'trust'
  return <svg className="brand-illustration" viewBox={(trust ? trustWindows : categoryWindows)[index]} aria-hidden="true" focusable="false">
    <image href={trust ? '/elpyo-trust-icons-v1.png' : '/elpyo-category-icons-v1.png'} width={trust ? 1254 : 1536} height={trust ? 1254 : 1024} />
  </svg>
}
