/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
       {
        protocol: 'https',
        hostname: 'flagsapi.com',
      },
      {
        protocol: 'https',
        hostname: process.env.AWS_S3_BUCKET_NAME ? `${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com` : 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'd3kg4rehsbwbdk.cloudfront.net',
      }
    ],
  },
  webpack: (config) => {
    config.ignoreWarnings = [
      /require.extensions is not supported by webpack/, // Ignorar avisos de require.extensions
      /Critical dependency: require function is used in a way/, // Ignorar avisos de require dinâmico
    ];
    return config;
  },
};

export default nextConfig;
