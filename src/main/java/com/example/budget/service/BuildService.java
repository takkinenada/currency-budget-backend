package com.example.budget.service;

import com.example.budget.build.BuildGenerator;
import com.example.budget.build.ComponentFilter;
import com.example.budget.build.GeneratedBuild;
import com.example.budget.build.PcBuild;
import com.example.budget.dto.BuildRequest;
import com.example.budget.dto.BuildResponse;
import com.example.budget.dto.BuildResultResponse;
import com.example.budget.model.Currency;
import com.example.budget.model.PcComponent;
import com.example.budget.repository.PcComponentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class BuildService {

    private final PcComponentRepository repository;
    private final CurrencyConversionService conversion;
    private final BuildGenerator generator = new BuildGenerator();

    public BuildService(PcComponentRepository repository, CurrencyConversionService conversion) {
        this.repository = repository;
        this.conversion = conversion;
    }

    @Transactional(readOnly = true)
    public BuildResultResponse generate(BuildRequest request) {
        BigDecimal budgetUah = conversion.convert(request.budget(), request.currency(), Currency.UAH);

        List<PcComponent> catalog = repository.findAll();
        List<GeneratedBuild> generated = generator.generate(
                catalog, budgetUah, ComponentFilter.of(request.brands()));

        if (generated.isEmpty()) {
            throw new NoBuildPossibleException(
                    "Не вдалося скласти сумісну збірку за таким бюджетом і брендами. "
                            + "Збільште бюджет або приберіть частину обмежень за брендами.");
        }

        List<BuildResponse> builds = generated.stream()
                .map(g -> toResponse(g, request.currency()))
                .toList();
        return new BuildResultResponse(request.budget(), request.currency(), budgetUah, builds);
    }

    private BuildResponse toResponse(GeneratedBuild generated, Currency currency) {
        PcBuild build = generated.build();
        List<BuildResponse.Part> parts = build.parts().stream()
                .map(c -> new BuildResponse.Part(
                        c.getType(),
                        c.getName(),
                        c.getShortSpec(),
                        c.getBrand(),
                        c.getShopUrl(),
                        conversion.convert(c.getPriceUah(), Currency.UAH, currency),
                        c.getPriceUah()))
                .toList();
        return new BuildResponse(
                generated.profile(),
                generated.profile().title(),
                generated.profile().description(),
                parts,
                conversion.convert(build.totalPrice(), Currency.UAH, currency),
                build.totalPrice(),
                round1(build.performanceScore()),
                round1(build.techScore()));
    }

    private static double round1(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}
