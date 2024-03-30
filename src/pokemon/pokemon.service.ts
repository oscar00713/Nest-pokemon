import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { Model, isValidObjectId } from 'mongoose';
import { Pokemon } from './entities/pokemon.entity';
import { InjectModel } from '@nestjs/mongoose';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class PokemonService {
  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>
  ) {}

  async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLocaleLowerCase();

    try {

    const pokemon = await this.pokemonModel.create(createPokemonDto);

    return pokemon;
    } catch (error) { 
      if (error.code === 11000) {
        throw new BadRequestException(`Pokemon already exists in db ${JSON.stringify(error.keyValue)}`);
      }
    
      console.log(error);
      throw new InternalServerErrorException(`Can't create pokemon - Check server logs`);
    }
  }

  findAll(PaginationDto:PaginationDto) {
    const {limit = 10, offset = 0} = PaginationDto;

    const salto = (offset - 1) * limit;
    return this.pokemonModel.find()
    .limit(limit)
    .skip(salto)
    .sort({no: 1})
    .select('-__v')
  }

  async findOne(id:string) {
    let pokemon: Pokemon;
    if (!isNaN(+id)) {
      pokemon = await this.pokemonModel.findOne({ no: id });
    } 
    //Buscar por mongo ID
    if(!pokemon && isValidObjectId(id)){
      pokemon = await this.pokemonModel.findById(id);
    }
     if(!pokemon)  pokemon = await this.pokemonModel.findOne({ name: id.toLocaleLowerCase().trim() });
    

    if (!pokemon) throw new NotFoundException(`Pokemon with id/name ${id} not found`);
    return pokemon;
  }

  async update(id: string, updatePokemonDto: UpdatePokemonDto) {

    const pokemon = await this.findOne(id);
    if (updatePokemonDto.name) {
      updatePokemonDto.name = updatePokemonDto.name.toLocaleLowerCase();
    }
     
    try {
    await pokemon.updateOne(updatePokemonDto, { new: true });
    } catch (error) {
    
        if (error.code === 11000) {
          throw new BadRequestException(`Pokemon already exists in db ${JSON.stringify(error.keyValue)}`);
        }
      
        console.log(error);
        throw new InternalServerErrorException(`Can't create pokemon - Check server logs`);
      }
    
    return { ...pokemon.toJSON(), ...updatePokemonDto };
  }

  async remove(id: string) {
   // const Pokemon = await this.findOne(id);
  //  await Pokemon.deleteOne();

  //const result = await this.pokemonModel.findByIdAndDelete(id);
    //if (!result) throw new NotFoundException(`Pokemon with id ${id} not found`);
    const {deletedCount} = await this.pokemonModel.deleteOne({ _id: id });  
     
    
    if (deletedCount === 0) {
      throw new BadRequestException(`Pokemon with id ${id} not found`);
    }

    return;
  }
}
