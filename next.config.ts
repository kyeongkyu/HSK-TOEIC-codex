import type {NextConfig} from 'next';
import withPWA from '@ducanh2912/next-pwa';

const offlinePrecacheRoutes = [
  '/',
  '/study',
  '/memorize',
  '/library',
  '/library/quiz',
  '/settings',
  '/grammar',
  '/quiz',
  '/toeic-part2',
  '/toeic-part5',
  '/sentence-completion/1',
  '/sentence-completion/2',
  '/sentence-completion/3',
  '/sentence-completion/4',
  '/sentence-completion/5',
  '/sentence-completion/6',
  '/offline.html',
];

const withPWAConfig = withPWA({
  dest: 'public',
  register: true,
  reloadOnOnline: true,
  cacheStartUrl: true,
  dynamicStartUrl: false,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  fallbacks: {
    document: '/offline.html',
  },
  workboxOptions: {
    additionalManifestEntries: offlinePrecacheRoutes.map((url) => ({
      url,
      revision: null,
    })),
  },
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Allow access to remote image placeholder.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**', // This allows any path under the hostname
      },
    ],
  },
  output: 'standalone',
  transpilePackages: ['motion'],
  webpack: (config, {dev}) => {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

export default withPWAConfig(nextConfig);
