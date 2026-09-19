package com.collegecontest.service;

import com.collegecontest.dto.ProblemDTO;
import com.collegecontest.model.Problem;
import com.collegecontest.repository.ProblemRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ProblemServiceTest {

    @Mock
    private ProblemRepository problemRepository;

    @InjectMocks
    private ProblemService problemService;

    @Test
    void getProblemById_mapsToDTO() {
        Problem p = new Problem();
        p.setId(11L);
        p.setTitle("Prob");
        when(problemRepository.findById(11L)).thenReturn(Optional.of(p));

        ProblemDTO dto = problemService.getProblemById(11L);

        assertNotNull(dto);
        assertEquals(11L, dto.getId());
        assertEquals("Prob", dto.getTitle());
    }
}
