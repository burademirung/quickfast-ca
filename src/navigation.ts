import { getPermalink } from './utils/permalinks';

export const headerData = {
  links: [
    {
      text: 'Services',
      links: [
        { text: 'All Services', href: getPermalink('/services/') },
        { text: 'HVAC & Heating', href: getPermalink('/services/hvac/') },
        { text: 'Plumbing', href: getPermalink('/services/plumbing/') },
        { text: 'Electrical', href: getPermalink('/services/electrical/') },
        { text: 'Duct Cleaning', href: getPermalink('/services/duct-cleaning/') },
        { text: 'Renovations', href: getPermalink('/services/renovations/') },
      ],
    },
    { text: 'About', href: getPermalink('/about/') },
    { text: 'Blog', href: getPermalink('/blog/') },
    { text: 'FAQ', href: getPermalink('/faq/') },
    { text: 'Contact', href: getPermalink('/contact/') },
  ],
  actions: [
    {
      variant: 'primary',
      text: 'Request Service',
      href: getPermalink('/contact/'),
      'data-open-request-dialog': 'true',
    },
  ],
};

export const footerData = {
  links: [
    {
      title: 'Services',
      links: [
        { text: 'HVAC & Heating', href: getPermalink('/services/hvac/') },
        { text: 'Plumbing', href: getPermalink('/services/plumbing/') },
        { text: 'Electrical', href: getPermalink('/services/electrical/') },
        { text: 'Duct Cleaning', href: getPermalink('/services/duct-cleaning/') },
        { text: 'Renovations', href: getPermalink('/services/renovations/') },
        { text: 'Commercial', href: getPermalink('/services/commercial/') },
      ],
    },
    {
      title: 'Company',
      links: [
        { text: 'About', href: getPermalink('/about/') },
        { text: 'Blog', href: getPermalink('/blog/') },
        { text: 'FAQ', href: getPermalink('/faq/') },
        { text: 'Contact', href: getPermalink('/contact/') },
      ],
    },
    {
      title: 'Legal',
      links: [
        { text: 'Privacy Policy', href: getPermalink('/privacy/') },
        { text: 'Terms of Service', href: getPermalink('/terms/') },
      ],
    },
  ],
  secondaryLinks: [
    { text: 'Privacy', href: getPermalink('/privacy/') },
    { text: 'Terms', href: getPermalink('/terms/') },
  ],
  socialLinks: [
    { ariaLabel: 'Facebook', icon: 'tabler:brand-facebook', href: '#' },
    { ariaLabel: 'Google Business', icon: 'tabler:brand-google', href: '#' },
    { ariaLabel: 'Maps', icon: 'tabler:map-pin', href: '#' },
  ],
  footNote: `\n    © ${new Date().getFullYear()} QuickFast Service Company. All rights reserved.\n  `,
};
