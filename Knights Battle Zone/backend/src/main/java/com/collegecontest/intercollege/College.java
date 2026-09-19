package com.collegecontest.intercollege;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "college")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class College {
    @Id
    private Long id;
    private String name;
}
