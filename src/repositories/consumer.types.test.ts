import { describe, it, expect } from 'vitest';
import { isConsumerProfileComplete } from './consumer.types';
import type { Consumer } from '@prisma/client';

describe('consumer.types', () => {
  describe('isConsumerProfileComplete', () => {
    const baseConsumer: Consumer = {
      id: 'consumer-123',
      firebaseUid: 'firebase-123',
      email: 'test@example.com',
      name: null,
      avatarUrl: null,
      credits: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return true when consumer has a non-empty name', () => {
      const consumer = { ...baseConsumer, name: 'John Doe' };
      expect(isConsumerProfileComplete(consumer)).toBe(true);
    });

    it('should return false when consumer name is null', () => {
      const consumer = { ...baseConsumer, name: null };
      expect(isConsumerProfileComplete(consumer)).toBe(false);
    });

    it('should return false when consumer name is empty string', () => {
      const consumer = { ...baseConsumer, name: '' };
      expect(isConsumerProfileComplete(consumer)).toBe(false);
    });

    it('should return false when consumer name is only whitespace', () => {
      const consumer = { ...baseConsumer, name: '   ' };
      expect(isConsumerProfileComplete(consumer)).toBe(false);
    });

    it('should return true when consumer name has whitespace padding but valid content', () => {
      const consumer = { ...baseConsumer, name: '  John Doe  ' };
      expect(isConsumerProfileComplete(consumer)).toBe(true);
    });
  });
});
