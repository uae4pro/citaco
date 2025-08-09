// Mock client to replace Base44 SDK
import { mockClient } from './mockClient.js';

// Export the mock client as base44 for compatibility
export const base44 = mockClient;
