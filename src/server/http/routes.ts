import type { RouteDefinition } from './context';
import {
  forgotPassword,
  googleConfig,
  googleLogin,
  login,
  logout,
  me,
  register,
  resetPassword,
  security,
} from '../modules/auth';
import {
  changePassword,
  createAddress,
  deleteAddress,
  getMeasurements,
  getProfile,
  listAddresses,
  updateAddress,
  updateMeasurements,
  updateProfile,
} from '../modules/users';
import { cancelCustomerOrder, getOrder, listOrders } from '../modules/orders';
import { listAppointments, createAppointment, cancelAppointment, updateAppointment, rescheduleAppointment } from '../modules/appointments';
import { addWishlist, listWishlist, removeWishlist } from '../modules/wishlist';
import {
  cancelGuestOrder,
  claimGuestOrder,
  createGuestSession,
  getGuestOrder,
  listGuestOrders,
  placeGuestOrder,
  placeMemberOrder,
  quoteCheckout,
} from '../modules/checkout';
import { getOrderPayments, recordPaymentBlocked } from '../modules/payments';
import { listShipments, trackShipment } from '../modules/shipping';
import {
  adminAppointments,
  adminCategories,
  adminCreateCategory,
  adminCreateProduct,
  adminCustomers,
  adminDashboard,
  adminDeleteCategory,
  adminDeleteProduct,
  adminOrders,
  adminPayments,
  adminProduct,
  adminProducts,
  adminRecordPayment,
  adminReviews,
  adminGetSettings,
  adminUpdateAppointmentStatus,
  adminUpdateCategory,
  adminUpdateOrderStatus,
  adminUpdatePaymentStatus,
  adminUpdateProduct,
  adminUpdateReviewStatus,
  adminUpdateSettings,
} from '../modules/admin';

const authLimit = { limit: 15 };

export const routes: RouteDefinition[] = [
  { method: 'GET', path: 'auth/google/config', browserSession: true, rateLimit: authLimit, handler: googleConfig },
  { method: 'POST', path: 'auth/google', browserSession: true, rateLimit: authLimit, handler: googleLogin },
  { method: 'POST', path: 'auth/register', rateLimit: authLimit, handler: register },
  { method: 'POST', path: 'auth/login', rateLimit: authLimit, handler: login },
  { method: 'GET', path: 'auth/me', auth: 'required', rateLimit: authLimit, handler: me },
  { method: 'GET', path: 'auth/security', auth: 'required', rateLimit: authLimit, handler: security },
  { method: 'POST', path: 'auth/logout', auth: 'required', rateLimit: authLimit, handler: logout },
  { method: 'POST', path: 'auth/forgot-password', rateLimit: authLimit, handler: forgotPassword },
  { method: 'POST', path: 'auth/reset-password', rateLimit: authLimit, handler: resetPassword },

  { method: 'GET', path: 'users/me', auth: 'required', handler: getProfile },
  { method: 'PUT', path: 'users/me', auth: 'required', handler: updateProfile },
  { method: 'POST', path: 'users/me/change-password', auth: 'required', handler: changePassword },
  { method: 'GET', path: 'users/me/measurements', auth: 'required', handler: getMeasurements },
  { method: 'PUT', path: 'users/me/measurements', auth: 'required', handler: updateMeasurements },
  { method: 'GET', path: 'users/me/addresses', auth: 'required', handler: listAddresses },
  { method: 'POST', path: 'users/me/addresses', auth: 'required', handler: createAddress },
  { method: 'PUT', path: 'users/me/addresses/:id', auth: 'required', handler: updateAddress },
  { method: 'DELETE', path: 'users/me/addresses/:id', auth: 'required', handler: deleteAddress },

  { method: 'GET', path: 'orders', auth: 'required', handler: listOrders },
  { method: 'GET', path: 'orders/:id', auth: 'required', handler: getOrder },
  { method: 'PATCH', path: 'orders/:id/cancel', auth: 'required', handler: cancelCustomerOrder },

  { method: 'GET', path: 'appointments', auth: 'required', handler: listAppointments },
  { method: 'POST', path: 'appointments', auth: 'required', handler: createAppointment },
  { method: 'PUT', path: 'appointments/:id', auth: 'required', handler: updateAppointment },
  { method: 'PATCH', path: 'appointments/:id/cancel', auth: 'required', handler: cancelAppointment },
  { method: 'PATCH', path: 'appointments/:id/reschedule', auth: 'required', handler: rescheduleAppointment },

  { method: 'GET', path: 'wishlist', auth: 'required', handler: listWishlist },
  { method: 'POST', path: 'wishlist', auth: 'required', handler: addWishlist },
  { method: 'DELETE', path: 'wishlist/:productId', auth: 'required', handler: removeWishlist },

  { method: 'POST', path: 'checkout/session', browserSession: true, rateLimit: { limit: 20 }, handler: createGuestSession },
  { method: 'POST', path: 'checkout/quote', browserSession: true, handler: quoteCheckout },
  { method: 'POST', path: 'checkout', auth: 'required', browserSession: true, rateLimit: { limit: 10 }, handler: placeMemberOrder },
  { method: 'POST', path: 'checkout/guest', browserSession: true, rateLimit: { limit: 10 }, handler: placeGuestOrder },
  { method: 'GET', path: 'checkout/guest/orders', browserSession: true, rateLimit: { limit: 30 }, handler: listGuestOrders },
  { method: 'GET', path: 'checkout/guest/orders/:id', browserSession: true, rateLimit: { limit: 30 }, handler: getGuestOrder },
  { method: 'PATCH', path: 'checkout/guest/orders/:id/cancel', browserSession: true, rateLimit: { limit: 10 }, handler: cancelGuestOrder },
  { method: 'POST', path: 'checkout/guest/orders/:id/claim', auth: 'required', browserSession: true, handler: claimGuestOrder },

  { method: 'GET', path: 'payments/order/:orderId', auth: 'required', handler: getOrderPayments },
  { method: 'POST', path: 'payments/record', auth: 'admin', handler: recordPaymentBlocked },

  { method: 'GET', path: 'shipping', auth: 'required', handler: listShipments },
  { method: 'GET', path: 'shipping/track/:trackingNumber', auth: 'required', handler: trackShipment },

  { method: 'GET', path: 'admin/dashboard', auth: 'admin', handler: adminDashboard },
  { method: 'GET', path: 'admin/products', auth: 'admin', handler: adminProducts },
  { method: 'POST', path: 'admin/products', auth: 'admin', handler: adminCreateProduct },
  { method: 'GET', path: 'admin/products/:id', auth: 'admin', handler: adminProduct },
  { method: 'PUT', path: 'admin/products/:id', auth: 'admin', handler: adminUpdateProduct },
  { method: 'DELETE', path: 'admin/products/:id', auth: 'admin', handler: adminDeleteProduct },
  { method: 'GET', path: 'admin/orders', auth: 'admin', handler: adminOrders },
  { method: 'PATCH', path: 'admin/orders/:id/status', auth: 'admin', handler: adminUpdateOrderStatus },
  { method: 'GET', path: 'admin/customers', auth: 'admin', handler: adminCustomers },
  { method: 'GET', path: 'admin/categories', auth: 'admin', handler: adminCategories },
  { method: 'POST', path: 'admin/categories', auth: 'admin', handler: adminCreateCategory },
  { method: 'PUT', path: 'admin/categories/:id', auth: 'admin', handler: adminUpdateCategory },
  { method: 'DELETE', path: 'admin/categories/:id', auth: 'admin', handler: adminDeleteCategory },
  { method: 'GET', path: 'admin/appointments', auth: 'admin', handler: adminAppointments },
  { method: 'PATCH', path: 'admin/appointments/:id/status', auth: 'admin', handler: adminUpdateAppointmentStatus },
  { method: 'GET', path: 'admin/reviews', auth: 'admin', handler: adminReviews },
  { method: 'PATCH', path: 'admin/reviews/:id/status', auth: 'admin', handler: adminUpdateReviewStatus },
  { method: 'GET', path: 'admin/settings', auth: 'admin', handler: adminGetSettings },
  { method: 'PUT', path: 'admin/settings', auth: 'admin', handler: adminUpdateSettings },
  { method: 'GET', path: 'admin/payments', auth: 'admin', handler: adminPayments },
  { method: 'POST', path: 'admin/payments', auth: 'admin', handler: adminRecordPayment },
  { method: 'PATCH', path: 'admin/payments/:id/status', auth: 'admin', handler: adminUpdatePaymentStatus },
];
