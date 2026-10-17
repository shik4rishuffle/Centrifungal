import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // React 19's compiler is opt-in upstream; pin the default explicitly so a
  // future Next minor flipping it on doesn't surprise the admin UI build.
  experimental: {
    reactCompiler: false,
  },
};

export default withPayload(nextConfig);
