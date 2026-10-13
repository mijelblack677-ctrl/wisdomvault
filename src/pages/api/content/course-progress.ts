export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';
import { isAuthorizedUser } from '@lib/auth-check';

// GET - Get user's progress for a specific course
export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const courseId = url.searchParams.get('courseId');

    if (!userId || !courseId) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'User ID and Course ID required' 
      }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!(await isAuthorizedUser(request, userId))) {
      return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    const sql = client;

    // Get progress
    const progress = await sql`
      SELECT 
        cp.*,
        pci.title as lesson_title,
        pci.content_type,
        pci.file_url
      FROM course_progress cp
      JOIN premium_content_items pci ON cp.lesson_id = pci.id
      WHERE cp.user_id = ${userId} AND cp.course_id = ${courseId}
      ORDER BY cp.completed_at DESC
    `;

    // Get total lessons count
    const totalLessons = await sql`
      SELECT COUNT(*) as count FROM premium_content_items 
      WHERE pack_id = ${courseId}
    `;

    // Get completed count
    const completedLessons = await sql`
      SELECT COUNT(*) as count FROM course_progress 
      WHERE user_id = ${userId} AND course_id = ${courseId} AND completed = true
    `;

    return new Response(JSON.stringify({
      success: true,
      progress: progress || [],
      stats: {
        totalLessons: parseInt(totalLessons[0]?.count || '0'),
        completedLessons: parseInt(completedLessons[0]?.count || '0'),
        progressPercentage: totalLessons[0]?.count > 0 
          ? Math.round((parseInt(completedLessons[0]?.count || '0') / parseInt(totalLessons[0]?.count || '0')) * 100)
          : 0
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const err = error as Error;
    console.error('Course progress error:', err);
    return new Response(JSON.stringify({ 
      success: false, 
      message: err.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST - Mark a lesson as complete
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { userId, courseId, lessonId } = body;

    if (!userId || !courseId || !lessonId) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'User ID, Course ID, and Lesson ID required' 
      }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!(await isAuthorizedUser(request, userId))) {
      return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    const sql = client;

    // Check if already completed
    const existing = await sql`
      SELECT id FROM course_progress 
      WHERE user_id = ${userId} AND course_id = ${courseId} AND lesson_id = ${lessonId}
    `;

    if (existing.length === 0) {
      // Insert new progress
      await sql`
        INSERT INTO course_progress (user_id, course_id, lesson_id, completed, completed_at)
        VALUES (${userId}, ${courseId}, ${lessonId}, true, NOW())
      `;
    } else {
      // Update existing
      await sql`
        UPDATE course_progress 
        SET completed = true, completed_at = NOW()
        WHERE id = ${existing[0].id}
      `;
    }

    // Get updated stats
    const totalLessons = await sql`
      SELECT COUNT(*) as count FROM premium_content_items 
      WHERE pack_id = ${courseId}
    `;

    const completedLessons = await sql`
      SELECT COUNT(*) as count FROM course_progress 
      WHERE user_id = ${userId} AND course_id = ${courseId} AND completed = true
    `;

    // Check if course is complete
    const isComplete = parseInt(completedLessons[0]?.count || '0') === parseInt(totalLessons[0]?.count || '0');

    // If course is complete, award certificate/badge
    if (isComplete) {
      await sql`
        INSERT INTO notifications (user_id, type, title, message, link)
        VALUES (
          ${userId},
          'course_completed',
          '🎓 Course Completed!',
          'Congratulations! You have completed all lessons in this course. Check your certificates!',
          '/dashboard/courses'
        )
      `;
    }

    return new Response(JSON.stringify({
      success: true,
      message: isComplete ? '🎓 Course completed! Congratulations!' : 'Lesson marked as complete!',
      stats: {
        totalLessons: parseInt(totalLessons[0]?.count || '0'),
        completedLessons: parseInt(completedLessons[0]?.count || '0'),
        progressPercentage: totalLessons[0]?.count > 0 
          ? Math.round((parseInt(completedLessons[0]?.count || '0') / parseInt(totalLessons[0]?.count || '0')) * 100)
          : 0,
        isComplete: isComplete
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const err = error as Error;
    console.error('Mark lesson complete error:', err);
    return new Response(JSON.stringify({ 
      success: false, 
      message: err.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
