/**
 * Coding problems served to the editor during technical interviews.
 * The interviewer prompt in the frontend hook describes the same problem.
 */
export const PROBLEMS = {
  'two-sum': {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    description: `Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target.

Example 1:
Input: nums = [2, 7, 11, 15], target = 9
Output: [0, 1]
Explanation: nums[0] + nums[1] = 2 + 7 = 9

Example 2:
Input: nums = [3, 2, 4], target = 6
Output: [1, 2]

Example 3:
Input: nums = [3, 3], target = 6
Output: [0, 1]

Constraints:
Each input has exactly one solution.
You may not use the same element twice.
You can return the answer in any order.`
  }
};

export const DEFAULT_PROBLEM_ID = 'two-sum';
