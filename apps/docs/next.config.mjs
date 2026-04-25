import nextra from 'nextra';

const withNextra = nextra({
  defaultShowCopyCode: true,
  search: { codeblocks: false },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
};

export default withNextra(nextConfig);
