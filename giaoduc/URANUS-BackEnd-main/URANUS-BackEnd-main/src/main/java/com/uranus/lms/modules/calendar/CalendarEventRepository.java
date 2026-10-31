package com.uranus.lms.modules.calendar;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface CalendarEventRepository extends JpaRepository<CalendarEvent, UUID> {
    
    @Query("SELECT e FROM CalendarEvent e WHERE (e.course.id IN :courseIds OR e.course IS NULL) AND e.startTime >= :start AND e.startTime <= :end ORDER BY e.startTime ASC")
    List<CalendarEvent> findEventsForUser(@Param("courseIds") List<UUID> courseIds, 
                                          @Param("start") LocalDateTime start, 
                                          @Param("end") LocalDateTime end);
}
