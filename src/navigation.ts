import { getPermalink } from './utils/permalinks';

export const headerData = {
  links: [
    {
      text: 'Services',
      links: [
        { text: 'Heating', href: getPermalink('/services/heating/') },
        { text: 'Air Conditioning', href: getPermalink('/services/air-conditioning/') },
        { text: 'Water Heaters', href: getPermalink('/services/water-heaters/') },
        { text: 'Plumbing', href: getPermalink('/services/plumbing/') },
        { text: 'Electrical', href: getPermalink('/services/electrical/') },
        { text: 'Medical-Grade Duct Cleaning', href: getPermalink('/services/duct-cleaning/') },
        { text: 'Property Management', href: getPermalink('/services/property-management/') },
        { text: 'Commercial', href: getPermalink('/services/commercial/') },
        { text: 'Construction & Renovations', href: getPermalink('/services/renovations/') },
        { text: 'Other Services', href: getPermalink('/services/other-services/') },
        { text: '— View All Services →', href: getPermalink('/services/') },
      ],
    },
    { text: 'Plans', href: getPermalink('/pricing/') },
    { text: 'Shop', href: getPermalink('/shop/') },
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
        { text: 'Heating', href: getPermalink('/services/heating/') },
        { text: 'Air Conditioning', href: getPermalink('/services/air-conditioning/') },
        { text: 'Water Heaters', href: getPermalink('/services/water-heaters/') },
        { text: 'Plumbing', href: getPermalink('/services/plumbing/') },
        { text: 'Electrical', href: getPermalink('/services/electrical/') },
        { text: 'Duct Cleaning', href: getPermalink('/services/duct-cleaning/') },
      ],
    },
    {
      title: 'More Services',
      links: [
        { text: 'Property Management', href: getPermalink('/services/property-management/') },
        { text: 'Commercial', href: getPermalink('/services/commercial/') },
        { text: 'Construction & Renovations', href: getPermalink('/services/renovations/') },
        { text: 'Other Services', href: getPermalink('/services/other-services/') },
        { text: 'Maintenance Plans', href: getPermalink('/pricing/') },
        { text: 'Equipment Shop', href: getPermalink('/shop/') },
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
  footNote: `\n    © ${new Date().getFullYear()} QuickFast Service Company · Proudly Canadian · Mississauga, Ontario\n  `,
};
